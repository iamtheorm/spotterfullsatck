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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Trip Dispatch
        </span>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          <span>{isCollapsed ? "Expand" : "Collapse"}</span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Origin & Destination */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Origin
                </label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Chicago, IL"
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={swapLocations}
                title="Swap origin and destination"
                className="p-2 mt-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Dallas, TX"
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Departure Time & Load Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Departure (Local)
              </label>
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Gross Load (lbs)
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
                className="w-full bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Sampling Interval */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Sampling Step</span>
              <span className="font-mono text-emerald-400 font-semibold">{stepMiles} miles</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[10, 25, 50].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setStepMiles(interval)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                    stepMiles === interval
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-semibold"
                      : "bg-slate-800/80 text-slate-400 border-slate-700/70 hover:text-white"
                  }`}
                >
                  {interval} mi
                </button>
              ))}
            </div>
          </div>

          {/* Advanced toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
            >
              <span>ORS API Key</span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showAdvanced && (
              <div className="mt-1.5">
                <input
                  type="password"
                  value={orsApiKey}
                  onChange={(e) => setOrsApiKey(e.target.value)}
                  placeholder="Optional: ORS key in .env is already loaded"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating 3 Routes...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Evaluate 3 Routes</span>
              </>
            )}
          </button>
        </form>
      )}

      {isCollapsed && (
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-300 truncate font-medium">
            {origin} → {destination} ({loadWeight} lbs)
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-xs text-emerald-400 font-semibold hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};
