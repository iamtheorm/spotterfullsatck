import React from "react";
import { Clock, Milestone, Flame, ShieldCheck } from "lucide-react";
import { RouteOption } from "../types";

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
}) => {
  const { summary, is_recommended, rank, name, distance_miles, duration_hours } =
    route;

  const hours = Math.floor(duration_hours);
  const minutes = Math.round((duration_hours - hours) * 60);

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl p-3.5 transition border ${
        isSelected
          ? is_recommended
            ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
            : "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold ${
              is_recommended
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            #{rank}
          </span>
          <span className="text-xs font-bold text-slate-900 tracking-tight line-clamp-1">
            {name}
          </span>
        </div>

        {is_recommended && (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            <span>Recommended</span>
          </span>
        )}
      </div>

      {/* No Travel Warning */}
      {summary.has_no_travel && (
        <div className="mb-2 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-800 text-[11px] flex items-center gap-1.5 font-semibold">
          <Flame className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <span>{summary.no_travel_miles} mi in No-Travel conditions</span>
        </div>
      )}

      {/* Stats Line */}
      <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-800">{hours}h {minutes}m</span>
        </span>
        <span className="flex items-center gap-1">
          <Milestone className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-800">{distance_miles} mi</span>
        </span>
        <span className="text-[11px]">
          Avg Risk: <strong className={summary.average_risk > 3 ? "text-red-600" : summary.average_risk > 2 ? "text-amber-600" : "text-emerald-700"}>{summary.average_risk.toFixed(1)}/5</strong>
        </span>
      </div>

      {/* Hazard Breakdown Badges */}
      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono text-center">
        <div className="py-1 px-1.5 rounded bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[10px] block font-sans">Severe</span>
          <span className={`font-bold ${summary.severe_miles > 0 ? "text-red-600" : "text-slate-700"}`}>
            {summary.severe_miles} mi
          </span>
        </div>
        <div className="py-1 px-1.5 rounded bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[10px] block font-sans">High</span>
          <span className={`font-bold ${summary.high_miles > 0 ? "text-amber-600" : "text-slate-700"}`}>
            {summary.high_miles} mi
          </span>
        </div>
        <div className="py-1 px-1.5 rounded bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[10px] block font-sans">Low / Mod</span>
          <span className="font-bold text-emerald-700">
            {(summary.low_miles + summary.moderate_miles).toFixed(0)} mi
          </span>
        </div>
      </div>
    </div>
  );
};
