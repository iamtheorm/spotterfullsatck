import React, { useState } from "react";
import {
  Navigation,
  Calendar,
  Weight,
  Layers,
  Key,
  ChevronDown,
  ChevronUp,
  Loader2,
  Route as RouteIcon,
  RotateCcw,
} from "lucide-react";
import { RouteEvaluationRequest } from "../types";

interface InputPanelProps {
  onEvaluate: (params: RouteEvaluationRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<RouteEvaluationRequest>;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onEvaluate,
  isLoading,
  initialValues,
}) => {
  const [origin, setOrigin] = useState(initialValues?.origin || "Chicago, IL");
  const [destination, setDestination] = useState(
    initialValues?.destination || "Dallas, TX"
  );

  // Set default departure to tomorrow at 08:00
  const getDefaultDeparture = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
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
  const [orsApiKey, setOrsApiKey] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update fields if initialValues changes (e.g. preset clicked)
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
      ors_api_key: orsApiKey.trim() || undefined,
    });
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <RouteIcon className="w-4 h-4 text-emerald-400" />
          <span>Trip Dispatch Parameters</span>
        </h2>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          3 Alternative Routes
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin & Destination */}
        <div className="space-y-2 relative">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Origin Location
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Chicago, IL or 41.8781,-87.6298"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />
              <span className="absolute right-3 top-2.5 w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-end pr-2 -my-1">
            <button
              type="button"
              onClick={swapLocations}
              title="Swap origin and destination"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Destination Location
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Dallas, TX or 32.7767,-96.7970"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />
              <span className="absolute right-3 top-2.5 w-2 h-2 rounded-full bg-red-400"></span>
            </div>
          </div>
        </div>

        {/* Departure Time & Load Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Departure Date & Time</span>
            </label>
            <input
              type="datetime-local"
              required
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Weight (lbs)</span>
            </label>
            <input
              type="number"
              min="1000"
              max="120000"
              step="500"
              required
              value={loadWeight}
              onChange={(e) => setLoadWeight(e.target.value)}
              placeholder="e.g. 34000"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {/* Sampling Interval Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Sampling Interval (Checkpoint Density)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Every {stepMiles} miles
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50].map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => setStepMiles(interval)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                  stepMiles === interval
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-sm"
                    : "bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {interval} Miles
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options Accordion */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-1 transition"
          >
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>Routing API Key (Optional)</span>
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-2 space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
              <label className="block text-[11px] text-slate-400">
                OpenRouteService (ORS) API Key:
              </label>
              <input
                type="password"
                value={orsApiKey}
                onChange={(e) => setOrsApiKey(e.target.value)}
                placeholder="Leave blank for automatic zero-config OSRM"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500">
                Out-of-the-box zero-config mode uses OSRM highway routing + live Open-Meteo weather forecasts.
              </p>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs tracking-wide uppercase transition shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Evaluating Weather Risk & Routes...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-white" />
              <span>Evaluate 3 Safe Routes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

