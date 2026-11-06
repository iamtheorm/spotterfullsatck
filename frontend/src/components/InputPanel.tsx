import React, { useState } from "react";
import {
  Navigation,
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Trip Dispatch Parameters
        </span>
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Origin Location
                </label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Chicago, IL"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <button
                type="button"
                onClick={swapLocations}
                title="Swap origin and destination"
                className="p-2 mt-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Destination Location
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Dallas, TX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>
            </div>
          </div>

          {/* Departure Time & Load Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Departure Time
              </label>
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          {/* Sampling Step */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
              <span>Sampling Step</span>
              <span className="font-mono text-blue-600 font-bold">Every {stepMiles} mi</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[10, 25, 50].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setStepMiles(interval)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                    stepMiles === interval
                      ? "bg-blue-50 text-blue-700 border-blue-500 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {interval} mi
                </button>
              ))}
            </div>
          </div>

          {/* Advanced ORS key */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium transition"
            >
              <span>ORS Key Override</span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showAdvanced && (
              <div className="mt-1.5">
                <input
                  type="password"
                  value={orsApiKey}
                  onChange={(e) => setOrsApiKey(e.target.value)}
                  placeholder="Leave empty to use active .env key"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
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
          <div className="text-xs text-slate-700 truncate font-semibold">
            {origin} → {destination} ({loadWeight} lbs)
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};
