import React, { useState } from "react";
import {
  MapPin,
  Calendar,
  Weight,
  Send,
  Loader2,
  ArrowLeftRight,
  Layers,
  Route as RouteIcon,
  ChevronDown,
  Clock,
} from "lucide-react";
import { RouteEvaluationRequest } from "../types";

interface InputPanelProps {
  onEvaluate: (params: RouteEvaluationRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<RouteEvaluationRequest>;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  onEvaluate,
  isLoading,
  initialValues,
  showHeatmap,
  onToggleHeatmap,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "weather">("details");

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

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between h-full select-none">
      <div>
        {/* Top Tab Bar matching screenshot: [Trip Details] [Weather Layer] */}
        <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "details"
                ? "bg-[#101c38] text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <RouteIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Trip Details</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("weather");
              onToggleHeatmap();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              showHeatmap && activeTab === "weather"
                ? "bg-[#101c38] text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Weather Layer</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Origin Location, Swap Button, Destination Location */}
          <div className="flex items-end gap-2">
            {/* Origin Location */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-900" />
                <span>Origin Location</span>
              </label>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Chicago, IL or Delhi, India"
                className="w-full bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
            </div>

            {/* Swap Button ⇄ */}
            <button
              type="button"
              onClick={handleSwap}
              title="Swap origin and destination"
              className="p-2 mb-0.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Destination Location */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-900" />
                <span>Destination Location</span>
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Dallas, TX or Kanpur, India"
                className="w-full bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Row 2: Departure Time & Gross Load (lbs) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Departure Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                Departure Time
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 text-slate-800 absolute left-3 pointer-events-none" />
                <input
                  type="datetime-local"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl pl-8 pr-6 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Gross Load (lbs) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1.5">
                Gross Load (lbs)
              </label>
              <div className="relative flex items-center">
                <Weight className="w-3.5 h-3.5 text-slate-800 absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  min="1000"
                  max="120000"
                  step="500"
                  required
                  value={loadWeight}
                  onChange={(e) => setLoadWeight(e.target.value)}
                  placeholder="34000"
                  className="w-full bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl pl-8 pr-6 py-2 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Sampling Step Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-600" />
              <span>Sampling Step</span>
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
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {interval} mi
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Primary Action Button: "Evaluate 3 Routes →" */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#101c38] hover:bg-[#0c162c] text-white font-bold text-xs md:text-[13px] transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 active:scale-[0.99]"
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
    </div>
  );
};
