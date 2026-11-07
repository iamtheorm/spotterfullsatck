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
} from "lucide-react";
import { RouteEvaluationRequest } from "../types";
import { CityAutocomplete } from "./CityAutocomplete";
import { LocationSuggestion } from "../services/api";

interface InputPanelProps {
  onEvaluate: (params: RouteEvaluationRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<RouteEvaluationRequest>;
  hasEvaluatedRoutes?: boolean;
}

const REGION_OPTIONS = [
  { code: "ALL", label: "Global / All Regions", flag: "🌐" },
  { code: "US", label: "United States (US)", flag: "🇺🇸" },
  { code: "IN", label: "India (IN)", flag: "🇮🇳" },
  { code: "CA", label: "Canada (CA)", flag: "🇨🇦" },
  { code: "GB", label: "United Kingdom (GB)", flag: "🇬🇧" },
  { code: "DE", label: "Germany (DE)", flag: "🇩🇪" },
  { code: "AU", label: "Australia (AU)", flag: "🇦🇺" },
];

export const InputPanel: React.FC<InputPanelProps> = ({
  onEvaluate,
  isLoading,
  initialValues,
  hasEvaluatedRoutes = false,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>("US");

  const [origin, setOrigin] = useState(initialValues?.origin || "Chicago, IL");
  const [destination, setDestination] = useState(
    initialValues?.destination || "Dallas, TX"
  );

  const getDefaultDeparture = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(2, 30, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [departureTime, setDepartureTime] = useState(
    initialValues?.departure_time
      ? initialValues.departure_time.slice(0, 16)
      : getDefaultDeparture()
  );
  const [loadWeight, setLoadWeight] = useState(
    initialValues?.load_weight?.toString() || "34000"
  );
  const [stepMiles, setStepMiles] = useState<number>(
    initialValues?.step_miles || 25
  );

  React.useEffect(() => {
    if (initialValues?.origin) setOrigin(initialValues.origin);
    if (initialValues?.destination) setDestination(initialValues.destination);
    if (initialValues?.load_weight)
      setLoadWeight(initialValues.load_weight.toString());
    if (initialValues?.step_miles) setStepMiles(initialValues.step_miles);
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    const parsedWeight = parseFloat(loadWeight) || 30000;
    const depIso = new Date(departureTime).toISOString();

    onEvaluate({
      origin: origin.trim(),
      destination: destination.trim(),
      departure_time: depIso,
      load_weight: parsedWeight,
      step_miles: stepMiles,
    });
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
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between h-full select-none">
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
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs cursor-pointer"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.flag} {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 2. Cascading Autocomplete: Origin Field */}
          <CityAutocomplete
            label="Origin Location"
            value={origin}
            country={selectedRegion}
            required
            onChange={(val) => setOrigin(val)}
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
            onChange={(val) => setDestination(val)}
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
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Gross Load (lbs) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Gross Load (lbs)
              </label>
              <div className="relative flex items-center">
                <Weight className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 pointer-events-none" />
                <input
                  type="number"
                  min="1000"
                  max="120000"
                  step="500"
                  required
                  value={loadWeight}
                  onChange={(e) => setLoadWeight(e.target.value)}
                  placeholder="34000"
                  className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* 5. Sampling Step Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-600" />
              <span>Checkpoint Interval</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((interval) => {
                const isSelected = stepMiles === interval;
                return (
                  <button
                    key={interval}
                    type="button"
                    onClick={() => setStepMiles(interval)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? "bg-[#101c38] text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {interval} mi
                  </button>
                );
              })}
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
