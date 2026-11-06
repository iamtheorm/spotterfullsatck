import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  Weight,
  Send,
  Loader2,
  RotateCcw,
  ChevronDown,
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
      {/* Header matching screenshot: Icon + Title + Reset Button */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Trip Dispatch Parameters
          </h2>
        </div>

        <button
          type="button"
          onClick={handleResetForm}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin Location & Destination Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Origin Location */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Origin Location
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Chicago, IL or Delhi, India"
                className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Destination Location */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Destination Location
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Dallas, TX or Kanpur, India"
                className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Departure Time & Gross Load (lbs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Departure Time */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Departure Time
            </label>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="datetime-local"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Gross Load (lbs) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Gross Load (lbs)
            </label>
            <div className="relative flex items-center">
              <Weight className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="number"
                min="1000"
                max="120000"
                step="500"
                required
                value={loadWeight}
                onChange={(e) => setLoadWeight(e.target.value)}
                placeholder="34000"
                className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Sampling Step Pills matching screenshot */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
            Sampling Step
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50].map((interval) => {
              const isSelected = stepMiles === interval;
              return (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setStepMiles(interval)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {interval} mi
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Action Button matching screenshot: "Evaluate 3 Routes →" */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
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
