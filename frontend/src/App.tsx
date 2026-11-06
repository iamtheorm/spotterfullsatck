import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { RouteCard } from "./components/RouteCard";
import { RouteComparison } from "./components/RouteComparison";
import { MapView } from "./components/MapView";
import { ForecastSlider } from "./components/ForecastSlider";
import { CheckpointModal } from "./components/CheckpointModal";
import { RiskRulesDrawer } from "./components/RiskRulesDrawer";
import {
  EvaluationResponse,
  RouteEvaluationRequest,
  Checkpoint,
  CorridorData,
} from "./types";
import { evaluateRoutes, fetchCorridorForecast } from "./services/api";
import { AlertCircle, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";

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
        // Default to the top recommended route
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

  // Initial evaluation on mount so app opens with interactive data
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

  // Update corridor grid when forecastHour changes (debounced for smooth sliding)
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

  const activeRoute =
    evaluation?.routes.find((r) => r.id === selectedRouteId) ||
    evaluation?.routes[0];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        onSelectPreset={handleSelectPreset}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-white underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Grid: Controls + Interactive Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Route Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <InputPanel
              onEvaluate={handleEvaluate}
              isLoading={isLoading}
              initialValues={formInputs}
            />

            {/* Evaluated Route Cards */}
            {evaluation && evaluation.routes && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Route Alternatives ({evaluation.routes.length})
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Sorted by safety rank
                  </span>
                </div>

                <div className="space-y-3">
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
          </div>

          {/* Right Column: Map & Forecast Slider (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Map Container */}
            <div className="h-[520px] w-full relative">
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
                selectedCheckpoint={selectedCheckpoint}
              />
            </div>

            {/* 0-48 Hour Forecast Evolution Slider */}
            <ForecastSlider
              forecastHour={forecastHour}
              onHourChange={setForecastHour}
              validTimeFormatted={corridorData?.valid_time_formatted}
              showHeatmap={showHeatmap}
              onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
              isLoadingCorridor={isLoadingCorridor}
            />
          </div>
        </div>

        {/* Bottom Section: Side-by-side Decision Matrix & Comparison */}
        {evaluation && evaluation.routes && evaluation.routes.length > 0 && (
          <RouteComparison
            routes={evaluation.routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => {
              setSelectedRouteId(id);
              const r = evaluation.routes.find((item) => item.id === id);
              if (r) setSelectedRouteName(r.name);
            }}
          />
        )}
      </main>

      {/* Checkpoint Detail Telemetry Modal */}
      <CheckpointModal
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
        routeName={selectedRouteName}
      />

      {/* Risk & Load Rules Documentation Drawer */}
      <RiskRulesDrawer
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Weather-Aware Truck Routing Engine • Django REST Framework + React + Leaflet + Open-Meteo</p>
      </footer>
    </div>
  );
}
export default App;

