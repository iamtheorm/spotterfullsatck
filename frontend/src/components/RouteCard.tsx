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
          ? "bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/40"
          : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold ${
              is_recommended
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            #{rank}
          </span>
          <span className="text-xs font-bold text-white tracking-tight line-clamp-1">
            {name}
          </span>
        </div>

        {is_recommended && (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            <span>Recommended</span>
          </span>
        )}
      </div>

      {/* No Travel Warning */}
      {summary.has_no_travel && (
        <div className="mb-2 px-2 py-1 rounded bg-red-950/60 border border-red-800/80 text-red-300 text-[11px] flex items-center gap-1.5 font-medium">
          <Flame className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span>{summary.no_travel_miles} mi in No-Travel conditions</span>
        </div>
      )}

      {/* Stats Line */}
      <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{hours}h {minutes}m</span>
        </span>
        <span className="flex items-center gap-1">
          <Milestone className="w-3 h-3 text-slate-400" />
          <span>{distance_miles} mi</span>
        </span>
        <span className="text-[11px]">
          Avg Risk: <strong className={summary.average_risk > 3 ? "text-red-400" : summary.average_risk > 2 ? "text-amber-400" : "text-emerald-400"}>{summary.average_risk.toFixed(1)}</strong>
        </span>
      </div>

      {/* Hazard badges */}
      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
        <div className="py-1 px-1.5 rounded bg-slate-950 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Severe</span>
          <span className={`font-bold ${summary.severe_miles > 0 ? "text-red-400" : "text-slate-300"}`}>
            {summary.severe_miles} mi
          </span>
        </div>
        <div className="py-1 px-1.5 rounded bg-slate-950 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">High</span>
          <span className={`font-bold ${summary.high_miles > 0 ? "text-amber-400" : "text-slate-300"}`}>
            {summary.high_miles} mi
          </span>
        </div>
        <div className="py-1 px-1.5 rounded bg-slate-950 border border-slate-800">
          <span className="text-slate-500 text-[10px] block">Low/Mod</span>
          <span className="font-bold text-emerald-400">
            {(summary.low_miles + summary.moderate_miles).toFixed(0)} mi
          </span>
        </div>
      </div>
    </div>
  );
};
