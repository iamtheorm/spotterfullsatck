import React from "react";
import {
  X,
  Wind,
  CloudRain,
  Snowflake,
  Clock,
  Milestone,
  AlertTriangle,
  Weight,
  MapPin,
} from "lucide-react";
import { Checkpoint, RiskLevel } from "../types";

interface CheckpointModalProps {
  checkpoint: Checkpoint | null;
  onClose: () => void;
  routeName?: string;
}

const getBadgeClasses = (level: RiskLevel) => {
  switch (level) {
    case "No Travel":
      return "bg-black text-red-400 border-red-600";
    case "Severe":
      return "bg-red-950/80 text-red-300 border-red-600";
    case "High":
      return "bg-orange-950/80 text-orange-300 border-orange-600";
    case "Moderate":
      return "bg-amber-950/80 text-amber-300 border-amber-600";
    default:
      return "bg-emerald-950/80 text-emerald-300 border-emerald-600";
  }
};

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpoint,
  onClose,
  routeName,
}) => {
  if (!checkpoint) return null;

  const {
    mile_marker,
    eta_formatted,
    lat,
    lon,
    final_level,
    final_score,
    weather,
    conditions,
    load_weight_lbs,
    active_overrides,
  } = checkpoint;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
            style={{ backgroundColor: checkpoint.color }}
          >
            <Milestone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                Checkpoint @ Mile {mile_marker}
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${getBadgeClasses(
                  final_level
                )}`}
              >
                {final_level} Risk (Score: {final_score}/5)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {routeName || "Selected Route"} • Lat: {lat.toFixed(4)}, Lon: {lon.toFixed(4)}
            </p>
          </div>
        </div>

        {/* ETA & Travel Time */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Estimated Arrival (ETA)
              </div>
              <div className="font-semibold text-white">{eta_formatted}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-300">
            <Weight className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Truck Gross Weight
              </div>
              <div className="font-semibold text-white">
                {load_weight_lbs.toLocaleString()} lbs
              </div>
            </div>
          </div>
        </div>

        {/* Weather Conditions Grid */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Weather Forecast at Arrival Time
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Wind */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center space-x-1.5 text-cyan-400 text-xs font-medium mb-1">
                <Wind className="w-4 h-4" />
                <span>Wind Speed</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {weather.wind_mph} <span className="text-xs font-normal text-slate-400">mph</span>
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium border ${getBadgeClasses(
                  conditions.wind.level
                )}`}
              >
                {conditions.wind.level}
              </span>
            </div>

            {/* Rain */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-medium mb-1">
                <CloudRain className="w-4 h-4" />
                <span>Rain Rate</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {weather.rain_in_per_hr}{" "}
                <span className="text-xs font-normal text-slate-400">in/hr</span>
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium border ${getBadgeClasses(
                  conditions.rain.level
                )}`}
              >
                {conditions.rain.level}
              </span>
            </div>

            {/* Snow */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center space-x-1.5 text-indigo-300 text-xs font-medium mb-1">
                <Snowflake className="w-4 h-4" />
                <span>Snowfall</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {weather.snow_in_per_hr}{" "}
                <span className="text-xs font-normal text-slate-400">in/hr</span>
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium border ${getBadgeClasses(
                  conditions.snow.level
                )}`}
              >
                {conditions.snow.level}
              </span>
            </div>
          </div>
        </div>

        {/* Active Load Rule Adjustments */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Load Rule Adjustments</span>
          </div>
          {active_overrides && active_overrides.length > 0 ? (
            <ul className="space-y-1">
              {active_overrides.map((override, i) => (
                <li
                  key={i}
                  className="text-amber-300 font-medium bg-amber-950/40 p-2 rounded border border-amber-800/60 flex items-start gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0"></span>
                  <span>{override}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic">
              Standard condition thresholds applied. No special load weight overrides triggered at this checkpoint.
            </p>
          )}
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

