import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  Weight,
  Send,
  Loader2,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { RouteEvaluationRequest } from "../types";

interface InputPanelProps {
  onEvaluate: (params: RouteEvaluationRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<RouteEvaluationRequest>;
  onReset?: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onEvaluate,
  isLoading,
  initialValues,
  onReset,
}) => {
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

  const [showPresets, setShowPresets] = useState(false);

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

  const handleResetForm = () => {
    setOrigin("Chicago, IL");
    setDestination("Dallas, TX");
    setDepartureTime(getDefaultDeparture());
    setLoadWeight("34000");
    setStepMiles(25);
    if (onReset) onReset();
  };

  const applyPreset = (orig: string, dest: string, weight: number) => {
    setOrigin(orig);
    setDestination(dest);
    setLoadWeight(weight.toString());
    setShowPresets(false);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs select-none">
      {/* Header matching screenshot: Icon + Title + Reset Button */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          {/* Blue route branching icon */}
          <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <svg
              className="w-3 h-3 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight font-sans">
            Trip Dispatch Parameters
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Preset Helper Button */}
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition px-2 py-0.5 rounded-lg hover:bg-slate-100"
            title="Quick route presets"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Presets</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetForm}
            className="text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Quick Presets Dropdown */}
      {showPresets && (
        <div className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Choose Corridor Preset:
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-medium">
            <button
              type="button"
              onClick={() => applyPreset("Chicago, IL", "Dallas, TX", 34000)}
              className="text-left px-2 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700"
            >
              🇺🇸 Chicago → Dallas (34k lb)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("Delhi, India", "Kanpur, India", 34000)}
              className="text-left px-2 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700"
            >
              🇮🇳 Delhi → Kanpur (34k lb)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("Delhi, India", "Lucknow, India", 34000)}
              className="text-left px-2 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700"
            >
              🇮🇳 Delhi → Lucknow (34k lb)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("Atlanta, GA", "Miami, FL", 28000)}
              className="text-left px-2 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700"
            >
              🇺🇸 Atlanta → Miami (28k lb)
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Origin Location & Destination Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Origin Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Origin Location
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-800 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Chicago, IL or Delhi, India"
                className="w-full bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Destination Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Destination Location
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-800 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Dallas, TX or Kanpur, India"
                className="w-full bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Departure Time & Gross Load (lbs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Departure Time */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Departure Time
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-slate-800 absolute left-3 pointer-events-none" />
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Gross Load (lbs) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Gross Load (lbs)
            </label>
            <div className="relative flex items-center">
              <Weight className="w-4 h-4 text-slate-800 absolute left-3 pointer-events-none" />
              <input
                type="number"
                min="1000"
                max="120000"
                step="500"
                required
                value={loadWeight}
                onChange={(e) => setLoadWeight(e.target.value)}
                placeholder="34000"
                className="w-full bg-white hover:bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 3: Sampling Step Pills matching screenshot */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Sampling Step
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[10, 25, 50].map((interval) => {
              const isSelected = stepMiles === interval;
              return (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setStepMiles(interval)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#101c38] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {interval} mi
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: Primary Action Button matching screenshot: "✈️ Evaluate 3 Routes →" */}
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
      </form>
    </div>
  );
};
