import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { RouteCard } from "./components/RouteCard";
import { RouteComparison } from "./components/RouteComparison";
import { MapView } from "./components/MapView";
import { CheckpointModal } from "./components/CheckpointModal";
import { RiskRulesDrawer } from "./components/RiskRulesDrawer";
import {
  EvaluationResponse,
  RouteEvaluationRequest,
  Checkpoint,
  CorridorData,
} from "./types";
import { evaluateRoutes, fetchCorridorForecast } from "./services/api";
import { AlertCircle, TableProperties } from "lucide-react";

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

  // Form input preset state
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

  // Preset quick-selection
  const handleSelectPreset = (
    origin: string,
    dest: string,
    weight: number
  ) => {
    const updated = {
      origin,
      destination: dest,
      load_weight: weight,
      step_miles: 25,
    };
    setFormInputs(updated);

    const now = new Date();
    now.setHours(now.getHours() + 12);
    handleEvaluate({
      origin,
      destination: dest,
      departure_time: now.toISOString(),
      load_weight: weight,
      step_miles: 25,
    });
  };

  // Initial evaluation on mount
  useEffect(() => {
    const initialDep = new Date();
    initialDep.setDate(initialDep.getDate() + 1);
    initialDep.setHours(8, 0, 0, 0);

    handleEvaluate({
      origin: "Chicago, IL",
      destination: "Dallas, TX",
      departure_time: initialDep.toISOString(),
      load_weight: 34000,
      step_miles: 25,
    });
  }, []);

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
    <div className="h-screen w-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Slim 5% App Header */}
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Two-Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Sidebar: Trip Dispatch Parameters & Focus Route Cards */}
        <aside className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-slate-200/90 bg-slate-50 flex flex-col overflow-y-auto p-3.5 space-y-3 z-10 shadow-2xs">
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between font-medium">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900 underline text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Trip Dispatch Parameters Form */}
          <InputPanel
            onEvaluate={handleEvaluate}
            isLoading={isLoading}
            initialValues={formInputs}
          />

          {/* Route Alternatives List */}
          {evaluation && evaluation.routes && evaluation.routes.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Route Alternatives ({evaluation.routes.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsComparisonOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition"
                >
                  <TableProperties className="w-3.5 h-3.5" />
                  <span>Compare</span>
                </button>
              </div>

              <div className="space-y-2">
                {evaluation.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={route.id === selectedRouteId}
                    onSelect={() => {
                      setSelectedRouteId(route.id);
                      setSelectedRouteName(route.name);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Main Map Canvas with Floating Overlays */}
        <main className="flex-1 h-full overflow-hidden relative p-3">
          <MapView
            routes={evaluation?.routes || []}
            selectedRouteId={selectedRouteId}
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
            corridorData={corridorData}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            forecastHour={forecastHour}
            onHourChange={setForecastHour}
            isLoadingCorridor={isLoadingCorridor}
            selectedCheckpoint={selectedCheckpoint}
          />
        </main>
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
