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
} from "lucide-react";
import { Checkpoint, RiskLevel, DistanceUnit, WeightUnit } from "../types";

interface CheckpointModalProps {
  checkpoint: Checkpoint | null;
  onClose: () => void;
  routeName?: string;
  distanceUnit?: DistanceUnit;
  weightUnit?: WeightUnit;
}

const getBadgeClasses = (level: RiskLevel) => {
  switch (level) {
    case "No Travel":
      return "bg-slate-900 text-white border-slate-900 font-bold";
    case "Severe":
      return "bg-red-50 text-red-700 border-red-200 font-bold";
    case "High":
      return "bg-orange-50 text-orange-700 border-orange-200 font-bold";
    case "Moderate":
      return "bg-amber-50 text-amber-700 border-amber-200 font-bold";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
  }
};

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpoint,
  onClose,
  routeName,
  distanceUnit = "mi",
  weightUnit = "lbs",
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

  const checkpointLabel = distanceUnit === "km"
    ? `Checkpoint @ ${Math.round(mile_marker * 1.60934)} km`
    : `Checkpoint @ Mile ${mile_marker}`;

  const weightLabel = weightUnit === "kg"
    ? `${Math.round(load_weight_lbs / 2.20462).toLocaleString()} kg`
    : `${load_weight_lbs.toLocaleString()} lbs`;

  const windSpeedLabel = distanceUnit === "km"
    ? `${Math.round(weather.wind_mph * 1.60934)} km/h`
    : `${weather.wind_mph} mph`;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
            style={{ backgroundColor: checkpoint.color }}
          >
            <Milestone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {checkpointLabel}
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full uppercase border ${getBadgeClasses(
                  final_level
                )}`}
              >
                {final_level} (Score: {final_score}/5)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {routeName || "Selected Route"} • {lat.toFixed(4)}, {lon.toFixed(4)}
            </p>
          </div>
        </div>

        {/* ETA & Travel Time */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-medium">
                Estimated Arrival (ETA)
              </div>
              <div className="font-bold text-slate-900">{eta_formatted}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-700">
            <Weight className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-medium">
                Gross Weight
              </div>
              <div className="font-bold text-slate-900">
                {weightLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Weather Conditions Grid */}
        <div className="mb-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Weather Forecast at Arrival
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Wind */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-cyan-700 text-xs font-semibold mb-1">
                <Wind className="w-4 h-4" />
                <span>Wind</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {windSpeedLabel}
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border ${getBadgeClasses(
                  conditions.wind.level
                )}`}
              >
                {conditions.wind.level}
              </span>
            </div>

            {/* Rain */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-blue-700 text-xs font-semibold mb-1">
                <CloudRain className="w-4 h-4" />
                <span>Rain</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {weather.rain_in_per_hr}{" "}
                <span className="text-xs font-normal text-slate-500">in/h</span>
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border ${getBadgeClasses(
                  conditions.rain.level
                )}`}
              >
                {conditions.rain.level}
              </span>
            </div>

            {/* Snow */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-1.5 text-indigo-700 text-xs font-semibold mb-1">
                <Snowflake className="w-4 h-4" />
                <span>Snow</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {weather.snow_in_per_hr}{" "}
                <span className="text-xs font-normal text-slate-500">in/h</span>
              </div>
              <span
                className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border ${getBadgeClasses(
                  conditions.snow.level
                )}`}
              >
                {conditions.snow.level}
              </span>
            </div>
          </div>
        </div>

        {/* Active Load Rule Adjustments */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Active Load Rule Adjustments</span>
          </div>
          {active_overrides && active_overrides.length > 0 ? (
            <ul className="space-y-1">
              {active_overrides.map((override, i) => (
                <li
                  key={i}
                  className="text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>
                  <span>{override}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">
              Standard condition thresholds applied. No special load weight overrides triggered at this checkpoint.
            </p>
          )}
        </div>

        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
