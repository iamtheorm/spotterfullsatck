import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { MapView } from "./components/MapView";
import { BottomRouteComparison } from "./components/BottomRouteComparison";
import { CheckpointModal } from "./components/CheckpointModal";
import { RiskRulesDrawer } from "./components/RiskRulesDrawer";
import { RouteComparison } from "./components/RouteComparison";
import {
  EvaluationResponse,
  RouteEvaluationRequest,
  Checkpoint,
  CorridorData,
} from "./types";
import { evaluateRoutes, fetchCorridorForecast } from "./services/api";
import { AlertCircle } from "lucide-react";

export function App() {
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(
    null
  );
  const [selectedRouteName, setSelectedRouteName] = useState<string>("");

  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);

  // Corridor slider state
  const [forecastHour, setForecastHour] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [corridorData, setCorridorData] = useState<CorridorData | undefined>(
    undefined
  );
  const [isLoadingCorridor, setIsLoadingCorridor] = useState<boolean>(false);

  // Form input state
  const [formInputs, setFormInputs] = useState<Partial<RouteEvaluationRequest>>({
    origin: "Chicago, IL",
    destination: "Dallas, TX",
    load_weight: 34000,
    step_miles: 25,
  });

  const corridorDebounceRef = useRef<any>(null);

  // Handle route evaluation submission
  const handleEvaluate = async (req: RouteEvaluationRequest) => {
    setIsLoading(true);
    setError(null);
    setSelectedCheckpoint(null);
    setForecastHour(0);

    try {
      const data = await evaluateRoutes(req);
      setEvaluation(data);
      if (data.routes && data.routes.length > 0) {
        const recommended =
          data.routes.find((r) => r.is_recommended) || data.routes[0];
        setSelectedRouteId(recommended.id);
        setSelectedRouteName(recommended.name);
      }
      setCorridorData(data.corridor);
    } catch (err: any) {
      setError(err.message || "Failed to calculate weather-aware routes.");
    } finally {
      setIsLoading(false);
    }
  };



  // Update corridor grid when forecastHour changes
  useEffect(() => {
    if (!evaluation || !evaluation.routes || evaluation.routes.length === 0)
      return;

    if (forecastHour === 0 && evaluation.corridor) {
      setCorridorData(evaluation.corridor);
      return;
    }

    if (corridorDebounceRef.current) {
      clearTimeout(corridorDebounceRef.current);
    }

    corridorDebounceRef.current = setTimeout(async () => {
      setIsLoadingCorridor(true);
      try {
        const coords = evaluation.routes.map((r) => r.coordinates);
        const newCorridor = await fetchCorridorForecast(
          coords,
          evaluation.params.departure_time,
          forecastHour
        );
        setCorridorData(newCorridor);
      } catch (e) {
        console.error("Failed to update corridor heatmap:", e);
      } finally {
        setIsLoadingCorridor(false);
      }
    }, 250);

    return () => {
      if (corridorDebounceRef.current) {
        clearTimeout(corridorDebounceRef.current);
      }
    };
  }, [forecastHour, evaluation]);

  return (
    <div className="h-screen w-screen bg-slate-200/60 p-2 md:p-3.5 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Outer rounded app frame matching screenshot */}
      <div className="flex-1 w-full h-full bg-[#f4f7fb] rounded-3xl shadow-xl border border-slate-300/80 flex flex-col overflow-hidden">
        {/* Top Header Banner */}
        <Header onOpenRules={() => setIsRulesOpen(true)} />

        {/* Error notification banner if any */}
        {error && (
          <div className="mx-4 mt-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between font-medium">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 underline text-[11px] font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Middle Section: Left Form & Right Map Canvas */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-3.5">
          {/* Left Column: Trip Details Card (4 cols) */}
          <div className="lg:col-span-4 h-full">
            <InputPanel
              onEvaluate={handleEvaluate}
              isLoading={isLoading}
              initialValues={formInputs}
              showHeatmap={showHeatmap}
              onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            />
          </div>

          {/* Right Column: Interactive Map (8 cols) */}
          <div className="lg:col-span-8 h-full min-h-[380px]">
            <MapView
              routes={evaluation?.routes || []}
              selectedRouteId={selectedRouteId}
              originName={evaluation?.origin?.name || formInputs.origin}
              destinationName={evaluation?.destination?.name || formInputs.destination}
              onSelectRoute={(id) => {
                setSelectedRouteId(id);
                const r = evaluation?.routes.find((item) => item.id === id);
                if (r) setSelectedRouteName(r.name);
              }}
              onSelectCheckpoint={(cp) => {
                setSelectedCheckpoint(cp);
              }}
              onOpenModal={(cp, rName) => {
                setSelectedCheckpoint(cp);
                setSelectedRouteName(rName);
              }}
              onOpenRules={() => setIsRulesOpen(true)}
              corridorData={corridorData}
              showHeatmap={showHeatmap}
              onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
              forecastHour={forecastHour}
              onHourChange={setForecastHour}
              isLoadingCorridor={isLoadingCorridor}
              selectedCheckpoint={selectedCheckpoint}
            />
          </div>
        </div>

        {/* Bottom Section: Route Comparison Row matching screenshot */}
        <div className="p-3.5 pt-0 shrink-0">
          <BottomRouteComparison
            routes={evaluation?.routes || []}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => {
              setSelectedRouteId(id);
              const r = evaluation?.routes.find((item) => item.id === id);
              if (r) setSelectedRouteName(r.name);
            }}
            onProceed={() => setIsComparisonOpen(true)}
          />
        </div>
      </div>

      {/* Checkpoint Detail Telemetry Modal */}
      <CheckpointModal
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
        routeName={selectedRouteName}
      />

      {/* Risk & Load Rules Guide Drawer */}
      <RiskRulesDrawer
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Side-by-side Decision Matrix Modal */}
      <RouteComparison
        routes={evaluation?.routes || []}
        selectedRouteId={selectedRouteId}
        onSelectRoute={(id) => {
          setSelectedRouteId(id);
          const r = evaluation?.routes.find((item) => item.id === id);
          if (r) setSelectedRouteName(r.name);
        }}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />
    </div>
  );
}

export default App;
