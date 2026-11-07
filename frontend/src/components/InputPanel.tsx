import React, { useState } from "react";
import {
  Globe,
  Calendar,
  Weight,
  Send,
  Loader2,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  CloudLightning,
} from "lucide-react";
import { RouteEvaluationRequest, DistanceUnit, WeightUnit } from "../types";
import { CityAutocomplete } from "./CityAutocomplete";
import { LocationSuggestion } from "../services/api";

interface InputPanelProps {
  onEvaluate: (params: RouteEvaluationRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<RouteEvaluationRequest>;
  hasEvaluatedRoutes?: boolean;
  selectedRegion?: string;
  onRegionChange?: (region: string) => void;
  onReset?: () => void;
  distanceUnit?: DistanceUnit;
  weightUnit?: WeightUnit;
  onDistanceUnitChange?: (unit: DistanceUnit) => void;
  onWeightUnitChange?: (unit: WeightUnit) => void;
}

const REGION_OPTIONS = [
  { code: "ALL", label: "Global / All Regions" },
  { code: "US", label: "United States (US)" },
  { code: "IN", label: "India (IN)" },
  { code: "CA", label: "Canada (CA)" },
  { code: "GB", label: "United Kingdom (GB)" },
  { code: "DE", label: "Germany (DE)" },
  { code: "AU", label: "Australia (AU)" },
];

export const InputPanel: React.FC<InputPanelProps> = ({
  onEvaluate,
  isLoading,
  initialValues,
  hasEvaluatedRoutes = false,
  selectedRegion = "US",
  onRegionChange,
  onReset,
  distanceUnit = "mi",
  weightUnit = "lbs",
  onDistanceUnitChange,
  onWeightUnitChange,
}) => {
  const [internalDistanceUnit, setInternalDistanceUnit] = useState<DistanceUnit>(distanceUnit);
  const [internalWeightUnit, setInternalWeightUnit] = useState<WeightUnit>(weightUnit);

  const activeDistanceUnit = distanceUnit || internalDistanceUnit;
  const activeWeightUnit = weightUnit || internalWeightUnit;

  const handleDistanceUnitChange = (u: DistanceUnit) => {
    setInternalDistanceUnit(u);
    if (onDistanceUnitChange) onDistanceUnitChange(u);
  };

  const handleWeightUnitChange = (u: WeightUnit) => {
    if (u === activeWeightUnit) return;
    const currentNum = parseFloat(loadWeight) || (activeWeightUnit === "lbs" ? 34000 : 15400);
    if (u === "kg") {
      setLoadWeight(Math.round(currentNum / 2.20462).toString());
    } else {
      setLoadWeight(Math.round(currentNum * 2.20462).toString());
    }
    setInternalWeightUnit(u);
    if (onWeightUnitChange) onWeightUnitChange(u);
  };

  const [origin, setOrigin] = useState(initialValues?.origin || "");
  const [destination, setDestination] = useState(
    initialValues?.destination || ""
  );

  const toLocalDateTimeInput = (isoOrDate?: string | Date): string => {
    const d = isoOrDate ? new Date(isoOrDate) : new Date();
    if (isNaN(d.getTime())) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getDefaultDeparture = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return toLocalDateTimeInput(d);
  };

  const [departureTime, setDepartureTime] = useState(
    initialValues?.departure_time
      ? toLocalDateTimeInput(initialValues.departure_time)
      : getDefaultDeparture()
  );

  const [loadWeight, setLoadWeight] = useState<string>(() => {
    const raw = initialValues?.load_weight || 34000;
    if (activeWeightUnit === "kg") {
      return Math.round(raw / 2.20462).toString();
    }
    return raw.toString();
  });

  const [stepMiles, setStepMiles] = useState<number>(
    initialValues?.step_miles || 25
  );

  const [weatherScenario, setWeatherScenario] = useState<"live" | "severe_storm">(
    (initialValues as any)?.weather_scenario || "live"
  );

  const timeEvalDebounceRef = React.useRef<any>(null);
  const weightEvalDebounceRef = React.useRef<any>(null);

  // Sync internal form inputs when parent initialValues update
  React.useEffect(() => {
    if (initialValues?.origin !== undefined && initialValues.origin !== origin) {
      setOrigin(initialValues.origin);
    }
    if (initialValues?.destination !== undefined && initialValues.destination !== destination) {
      setDestination(initialValues.destination);
    }
    if (initialValues?.load_weight !== undefined) {
      const val = initialValues.load_weight;
      setLoadWeight(
        activeWeightUnit === "kg"
          ? Math.round(val / 2.20462).toString()
          : val.toString()
      );
    }
    if (initialValues?.step_miles !== undefined) {
      setStepMiles(initialValues.step_miles);
    }
    if (initialValues?.departure_time !== undefined) {
      const localFormatted = toLocalDateTimeInput(initialValues.departure_time);
      if (localFormatted !== departureTime) {
        setDepartureTime(localFormatted);
      }
    }
  }, [
    initialValues?.origin,
    initialValues?.destination,
    initialValues?.load_weight,
    initialValues?.step_miles,
    initialValues?.departure_time,
    activeWeightUnit,
  ]);

  const triggerEvaluate = (
    overrideScenario?: "live" | "severe_storm",
    overrideStepMiles?: number,
    overrideDepartureTime?: string,
    overrideLoadWeight?: string
  ) => {
    if (!origin.trim() || !destination.trim()) return;

    const weightStr = overrideLoadWeight ?? loadWeight;
    const rawNum = parseFloat(weightStr) || (activeWeightUnit === "lbs" ? 34000 : 15400);
    const parsedWeightLbs = activeWeightUnit === "kg" ? Math.round(rawNum * 2.20462) : rawNum;

    const depTimeStr = overrideDepartureTime ?? departureTime;
    const parsedDate = new Date(depTimeStr);
    const depIso = isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();

    onEvaluate({
      origin: origin.trim(),
      destination: destination.trim(),
      departure_time: depIso,
      load_weight: parsedWeightLbs,
      step_miles: overrideStepMiles ?? stepMiles,
      weather_scenario: overrideScenario ?? weatherScenario,
    });
  };

  const handleDepartureTimeChange = (nextTime: string) => {
    setDepartureTime(nextTime);
    if (!nextTime || isNaN(new Date(nextTime).getTime())) return;
    if (origin.trim() && destination.trim()) {
      if (timeEvalDebounceRef.current) {
        clearTimeout(timeEvalDebounceRef.current);
      }
      timeEvalDebounceRef.current = setTimeout(() => {
        triggerEvaluate(weatherScenario, stepMiles, nextTime, loadWeight);
      }, 300);
    }
  };

  const handleLoadWeightChange = (nextWeight: string) => {
    setLoadWeight(nextWeight);
    const num = parseFloat(nextWeight);
    if (!num || num < 500) return;
    if (hasEvaluatedRoutes && origin.trim() && destination.trim()) {
      if (weightEvalDebounceRef.current) {
        clearTimeout(weightEvalDebounceRef.current);
      }
      weightEvalDebounceRef.current = setTimeout(() => {
        triggerEvaluate(weatherScenario, stepMiles, departureTime, nextWeight);
      }, 450);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerEvaluate();
  };

  const handleWeatherScenarioSelect = (nextScenario: "live" | "severe_storm") => {
    setWeatherScenario(nextScenario);
    if (origin.trim() && destination.trim()) {
      triggerEvaluate(nextScenario, stepMiles);
    }
  };

  const handleStepMilesSelect = (nextMiles: number) => {
    setStepMiles(nextMiles);
    if (hasEvaluatedRoutes && origin.trim() && destination.trim()) {
      triggerEvaluate(weatherScenario, nextMiles);
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleReset = () => {
    setOrigin("");
    setDestination("");
    setLoadWeight("34000");
    setStepMiles(25);
    setDepartureTime(getDefaultDeparture());
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-full select-none">
      <div className="space-y-4">
        {/* Panel Header with Title & Embedded System Status Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Trip Details
            </h2>
            {isLoading ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Evaluating...</span>
              </span>
            ) : hasEvaluatedRoutes ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Routes Evaluated</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                Ready
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1 transition"
            title="Reset parameters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Region / Country Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Region / Country Filter</span>
            </label>
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => onRegionChange && onRegionChange(e.target.value)}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs cursor-pointer"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* 2. Cascading Autocomplete: Origin Field */}
          <CityAutocomplete
            label="Origin Location"
            value={origin}
            country={selectedRegion}
            required
            onChange={(val, suggestion) => {
              setOrigin(val);
              if (suggestion?.country_code && onRegionChange) {
                const code = suggestion.country_code.toUpperCase();
                if (REGION_OPTIONS.some((r) => r.code === code)) {
                  onRegionChange(code);
                }
              }
            }}
            placeholder={
              selectedRegion === "IN"
                ? "Delhi, Noida, Mumbai..."
                : "Chicago, IL, New York..."
            }
          />

          {/* Swap Button (between Origin & Destination) */}
          <div className="flex justify-center -my-1.5 relative z-10">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap origin and destination"
              className="p-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 shadow-2xs transition hover:rotate-180 duration-200"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Cascading Autocomplete: Destination Field */}
          <CityAutocomplete
            label="Destination Location"
            value={destination}
            country={selectedRegion}
            required
            onChange={(val, suggestion) => {
              setDestination(val);
              if (suggestion?.country_code && onRegionChange) {
                const code = suggestion.country_code.toUpperCase();
                if (REGION_OPTIONS.some((r) => r.code === code)) {
                  onRegionChange(code);
                }
              }
            }}
            placeholder={
              selectedRegion === "IN"
                ? "Kanpur, Lucknow, Agra..."
                : "Dallas, TX, Miami, FL..."
            }
          />

          {/* 4. Departure Time & Gross Load (lbs) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Departure Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Departure Time
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 pointer-events-none" />
                <input
                  type="datetime-local"
                  required
                  value={departureTime}
                  onChange={(e) => handleDepartureTimeChange(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Gross Load with Unit Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-800">
                  Gross Load
                </label>
                <div className="relative inline-block">
                  <select
                    value={activeWeightUnit}
                    onChange={(e) => handleWeightUnitChange(e.target.value as WeightUnit)}
                    className="appearance-none text-[10px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md pl-1.5 pr-4 py-0.5 text-slate-700 cursor-pointer focus:outline-none transition"
                    title="Toggle between pounds (lbs) and kilograms (kg)"
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-500 absolute right-1 top-1.5 pointer-events-none" />
                </div>
              </div>
              <div className="relative flex items-center">
                <Weight className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 pointer-events-none" />
                <input
                  type="number"
                  min={activeWeightUnit === "kg" ? "500" : "1000"}
                  max={activeWeightUnit === "kg" ? "55000" : "120000"}
                  step={activeWeightUnit === "kg" ? "250" : "500"}
                  required
                  value={loadWeight}
                  onChange={(e) => handleLoadWeightChange(e.target.value)}
                  placeholder={activeWeightUnit === "kg" ? "15400" : "34000"}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* 5. Sampling Step Pills with Distance Unit Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>Checkpoint Interval</span>
              </label>
              <div className="relative inline-block">
                <select
                  value={activeDistanceUnit}
                  onChange={(e) => handleDistanceUnitChange(e.target.value as DistanceUnit)}
                  className="appearance-none text-[10px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md pl-1.5 pr-4 py-0.5 text-slate-700 cursor-pointer focus:outline-none transition"
                  title="Toggle distance unit between miles (mi) and kilometers (km)"
                >
                  <option value="mi">mi</option>
                  <option value="km">km</option>
                </select>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500 absolute right-1 top-1.5 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(activeDistanceUnit === "km"
                ? [
                    { miles: 10, label: "15 km" },
                    { miles: 25, label: "40 km" },
                    { miles: 50, label: "80 km" },
                  ]
                : [
                    { miles: 10, label: "10 mi" },
                    { miles: 25, label: "25 mi" },
                    { miles: 50, label: "50 mi" },
                  ]
              ).map((opt) => {
                const isSelected = stepMiles === opt.miles;
                return (
                  <button
                    key={opt.miles}
                    type="button"
                    onClick={() => handleStepMilesSelect(opt.miles)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? "bg-[#101c38] text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Condition Mode: Live Open-Meteo vs Severe Front Simulation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <CloudLightning className="w-3 h-3 text-amber-500" />
                <span>Weather Condition Mode</span>
              </label>
              {weatherScenario === "severe_storm" && (
                <span className="text-[9px] font-mono uppercase bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-black tracking-wider">
                  Storm Active
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleWeatherScenarioSelect("live")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  weatherScenario === "live"
                    ? "bg-[#101c38] text-white shadow-xs"
                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="Fetches real-time hourly forecasts from Open-Meteo"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Live Weather</span>
              </button>

              <button
                type="button"
                onClick={() => handleWeatherScenarioSelect("severe_storm")}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  weatherScenario === "severe_storm"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                title="Injects a realistic crosswind & severe storm front to test risk tiers, avoidance ranking, and air horn"
              >
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                <span>Severe Storm Front</span>
              </button>
            </div>
          </div>

          {/* 6. Prominently Anchored Evaluate 3 Routes Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#101c38] hover:bg-[#0c162c] text-white font-bold text-xs md:text-[13px] transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Evaluating 3 Routes...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Evaluate 3 Routes →</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
