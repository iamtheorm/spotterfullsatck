import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { InputPanel } from "./components/InputPanel";
import { MapView } from "./components/MapView";
import { RouteCard } from "./components/RouteCard";
import { CheckpointModal } from "./components/CheckpointModal";
import { RiskRulesDrawer } from "./components/RiskRulesDrawer";
import { RouteComparison } from "./components/RouteComparison";
import {
  EvaluationResponse,
  RouteEvaluationRequest,
  Checkpoint,
  CorridorData,
  DistanceUnit,
  WeightUnit,
} from "./types";
import { evaluateRoutes, fetchCorridorForecast } from "./services/api";
import { AlertCircle, SlidersHorizontal, ArrowRight, Truck } from "lucide-react";

function detectCountryCode(text?: string): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (
    t.includes("india") ||
    t.includes("delhi") ||
    t.includes("kanpur") ||
    t.includes("mumbai") ||
    t.includes("noida") ||
    t.includes("lucknow") ||
    t.includes("bengaluru") ||
    t.includes("bangalore") ||
    t.includes("agra") ||
    t.includes("jaipur") ||
    t.includes("chennai") ||
    t.includes("kolkata") ||
    t.includes(", in")
  ) {
    return "IN";
  }
  if (
    t.includes("canada") ||
    t.includes("toronto") ||
    t.includes("montreal") ||
    t.includes("vancouver") ||
    t.includes("calgary") ||
    t.includes("ottawa") ||
    t.includes(", ca")
  ) {
    return "CA";
  }
  if (
    t.includes("united kingdom") ||
    t.includes("london") ||
    t.includes("manchester") ||
    t.includes("birmingham") ||
    t.includes(", gb") ||
    t.includes(", uk")
  ) {
    return "GB";
  }
  if (
    t.includes("germany") ||
    t.includes("berlin") ||
    t.includes("munich") ||
    t.includes("frankfurt") ||
    t.includes("hamburg") ||
    t.includes(", de")
  ) {
    return "DE";
  }
  if (
    t.includes("australia") ||
    t.includes("sydney") ||
    t.includes("melbourne") ||
    t.includes("brisbane") ||
    t.includes("perth") ||
    t.includes(", au")
  ) {
    return "AU";
  }
  if (
    t.includes("usa") ||
    t.includes("united states") ||
    t.includes("chicago") ||
    t.includes("dallas") ||
    t.includes("new york") ||
    t.includes("los angeles") ||
    t.includes("houston") ||
    t.includes("phoenix") ||
    t.includes("miami") ||
    t.includes(", us") ||
    t.includes(", il") ||
    t.includes(", tx")
  ) {
    return "US";
  }
  return null;
}

export function App() {
  // Region filter state with local persistence
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("spotter_region");
      if (stored) return stored;
    } catch {}
    return "US";
  });

  // Form input state with local persistence
  const [formInputs, setFormInputs] = useState<Partial<RouteEvaluationRequest>>(() => {
    try {
      localStorage.removeItem("spotter_form_inputs");
      const stored = localStorage.getItem("safecorridor_form_inputs_v2");
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      origin: "Chicago, IL",
      destination: "Dallas, TX",
      load_weight: 34000,
      step_miles: 25,
    };
  });

  // Active evaluation response state with local persistence
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(() => {
    try {
      localStorage.removeItem("spotter_evaluation");
      localStorage.removeItem("safecorridor_evaluation_v2");
      localStorage.removeItem("safecorridor_evaluation_v3");
      localStorage.removeItem("safecorridor_evaluation_v4");
      localStorage.removeItem("safecorridor_evaluation_v5");
      localStorage.removeItem("safecorridor_evaluation_v6");
      const stored = localStorage.getItem("safecorridor_evaluation_v7");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    if (evaluation?.routes && evaluation.routes.length > 0) {
      const recommended =
        evaluation.routes.find((r) => r.is_recommended) || evaluation.routes[0];
      return recommended.id;
    }
    return "";
  });

  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(
    null
  );
  const [selectedRouteName, setSelectedRouteName] = useState<string>(() => {
    if (evaluation?.routes && evaluation.routes.length > 0) {
      const recommended =
        evaluation.routes.find((r) => r.is_recommended) || evaluation.routes[0];
      return recommended.name;
    }
    return "";
  });

  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);

  // Corridor slider state (Heatmap overlay defaults to false for clean route view)
  const [forecastHour, setForecastHour] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [corridorData, setCorridorData] = useState<CorridorData | undefined>(
    evaluation?.corridor
  );
  const [isLoadingCorridor, setIsLoadingCorridor] = useState<boolean>(false);

  // Unit preferences state (miles vs kilometers, pounds vs kilograms)
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(() => {
    try {
      return (localStorage.getItem("spotter_distance_unit") as DistanceUnit) || "mi";
    } catch {
      return "mi";
    }
  });

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() => {
    try {
      return (localStorage.getItem("spotter_weight_unit") as WeightUnit) || "lbs";
    } catch {
      return "lbs";
    }
  });

  const handleDistanceUnitChange = (u: DistanceUnit) => {
    setDistanceUnit(u);
    try {
      localStorage.setItem("spotter_distance_unit", u);
    } catch {}
  };

  const handleWeightUnitChange = (u: WeightUnit) => {
    setWeightUnit(u);
    try {
      localStorage.setItem("spotter_weight_unit", u);
    } catch {}
  };

  const corridorDebounceRef = useRef<any>(null);

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    try {
      localStorage.setItem("spotter_region", newRegion);
    } catch {}
  };

  const handleResetAll = () => {
    try {
      localStorage.removeItem("safecorridor_evaluation_v7");
      localStorage.removeItem("safecorridor_evaluation_v6");
      localStorage.removeItem("safecorridor_evaluation_v5");
      localStorage.removeItem("safecorridor_evaluation_v4");
      localStorage.removeItem("safecorridor_evaluation_v3");
      localStorage.removeItem("safecorridor_evaluation_v2");
      localStorage.removeItem("safecorridor_form_inputs_v2");
      localStorage.removeItem("spotter_evaluation");
      localStorage.removeItem("spotter_form_inputs");
    } catch {}
    setEvaluation(null);
    setSelectedRouteId("");
    setSelectedRouteName("");
    setCorridorData(undefined);
    setShowHeatmap(false);
    setFormInputs({
      origin: "",
      destination: "",
      load_weight: 34000,
      step_miles: 25,
    });
  };

  // Handle route evaluation submission
  const handleEvaluate = async (req: RouteEvaluationRequest) => {
    setIsLoading(true);
    setError(null);
    setSelectedCheckpoint(null);
    setForecastHour(0);
    setShowHeatmap(false);

    // Save submitted input immediately
    setFormInputs(req);
    try {
      localStorage.setItem("safecorridor_form_inputs_v2", JSON.stringify(req));
    } catch {}

    // Auto-detect or sync region from the submitted inputs
    const detected = detectCountryCode(req.origin) || detectCountryCode(req.destination);
    if (detected) {
      setSelectedRegion(detected);
      try {
        localStorage.setItem("spotter_region", detected);
      } catch {}
    }

    try {
      const data = await evaluateRoutes(req);
      setEvaluation(data);
      try {
        localStorage.setItem("safecorridor_evaluation_v7", JSON.stringify(data));
      } catch {}

      // Keep form inputs aligned with resolved display names
      const resolvedInputs: Partial<RouteEvaluationRequest> = {
        ...req,
        origin: data.origin?.name || req.origin,
        destination: data.destination?.name || req.destination,
      };
      setFormInputs(resolvedInputs);
      try {
        localStorage.setItem("safecorridor_form_inputs_v2", JSON.stringify(resolvedInputs));
      } catch {}

      // Also ensure detected country code matches resolved origin/destination
      const resolvedDetected =
        detectCountryCode(data.origin?.name) ||
        detectCountryCode(data.destination?.name) ||
        detected;
      if (resolvedDetected) {
        setSelectedRegion(resolvedDetected);
        try {
          localStorage.setItem("spotter_region", resolvedDetected);
        } catch {}
      }

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

  // Auto-evaluate on initial mount if origin & destination are present but evaluation cache was refreshed
  const didInitialEvalRef = useRef(false);
  useEffect(() => {
    if (didInitialEvalRef.current) return;
    didInitialEvalRef.current = true;
    if (!evaluation && formInputs.origin && formInputs.destination) {
      handleEvaluate({
        origin: formInputs.origin,
        destination: formInputs.destination,
        departure_time: formInputs.departure_time || new Date().toISOString(),
        load_weight: formInputs.load_weight || 34000,
        step_miles: formInputs.step_miles || 25,
      });
    }
  }, []);

  // Update corridor grid when forecastHour changes (only when heatmap overlay is active)
  useEffect(() => {
    if (!showHeatmap || !evaluation || !evaluation.routes || evaluation.routes.length === 0)
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
  }, [forecastHour, evaluation, showHeatmap]);

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Top Header: Full-width Application Title + Single Gear Settings Icon */}
      <Header onOpenSettings={() => setIsRulesOpen(true)} />

      {/* Error notification banner if any */}
      {error && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between font-medium z-40 shrink-0 shadow-xs">
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

      {/* Main Full-Screen Layout: Docked Left Dispatch Sidebar & Edge-to-Edge Map */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Docked Dispatch Sidebar */}
        <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 h-full bg-white border-r border-slate-200 flex flex-col overflow-y-auto p-4 gap-3.5 z-20 shadow-xs">
          {/* Trip Details Card */}
          <div className="shrink-0">
            <InputPanel
              onEvaluate={handleEvaluate}
              isLoading={isLoading}
              initialValues={formInputs}
              hasEvaluatedRoutes={Boolean(evaluation && evaluation.routes && evaluation.routes.length > 0)}
              selectedRegion={selectedRegion}
              onRegionChange={handleRegionChange}
              onReset={handleResetAll}
              distanceUnit={distanceUnit}
              weightUnit={weightUnit}
              onDistanceUnitChange={handleDistanceUnitChange}
              onWeightUnitChange={handleWeightUnitChange}
            />
          </div>

          {/* Alternative Routes List (Visible once routes are evaluated) */}
          {evaluation && evaluation.routes && evaluation.routes.length > 0 && (
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-black text-slate-900 tracking-tight">
                    Alternative Routes ({evaluation.routes.length})
                  </h3>
                  {evaluation.params?.departure_time && (
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                      Dep:{" "}
                      {new Date(evaluation.params.departure_time).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsComparisonOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Compare</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {evaluation.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={route.id === selectedRouteId}
                    onSelect={() => {
                      setSelectedRouteId(route.id);
                      setSelectedRouteName(route.name);
                    }}
                    distanceUnit={distanceUnit}
                  />
                ))}
              </div>

              {/* Proceed with Selected Route Button */}
              <button
                type="button"
                onClick={() => setIsComparisonOpen(true)}
                className="w-full mt-1 py-3 px-4 rounded-xl bg-[#101c38] hover:bg-[#0c162c] text-white flex items-center justify-center space-x-2 shadow-sm transition hover:shadow active:scale-95 group font-sans"
              >
                <Truck className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition duration-200" />
                <span className="font-extrabold text-xs">Proceed with Selected Route</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Full-Bleed Edge-to-Edge Map Canvas */}
        <div className="flex-1 h-full min-h-[400px] relative z-0">
          <MapView
            routes={evaluation?.routes || []}
            selectedRouteId={selectedRouteId}
            originName={evaluation?.origin?.name || formInputs.origin || "Origin"}
            destinationName={evaluation?.destination?.name || formInputs.destination || "Destination"}
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
            distanceUnit={distanceUnit}
          />
        </div>
      </div>

      {/* Checkpoint Detail Telemetry Modal */}
      <CheckpointModal
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
        routeName={selectedRouteName}
        distanceUnit={distanceUnit}
        weightUnit={weightUnit}
      />

      {/* Settings / Risk Rules Drawer */}
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
        distanceUnit={distanceUnit}
      />
    </div>
  );
}

export default App;
