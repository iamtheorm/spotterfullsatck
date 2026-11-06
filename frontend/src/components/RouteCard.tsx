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
      className={`cursor-pointer rounded-xl p-3.5 transition border shadow-xs ${
        isSelected
          ? is_recommended
            ? "bg-white border-slate-200 border-l-4 border-l-emerald-600 shadow-md ring-1 ring-emerald-500/20"
            : "bg-white border-slate-200 border-l-4 border-l-blue-600 shadow-md ring-1 ring-blue-500/20"
          : "bg-white border-slate-200/90 border-l-4 border-l-slate-300 hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
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
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">
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

      {/* Key Metrics: Prominent Bold Typography */}
      <div className="flex items-baseline justify-between py-1 mb-2 border-b border-slate-100">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
            {hours}h {minutes}m
          </span>
          <span className="text-xs text-slate-400 font-medium">travel time</span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-slate-700 font-mono">
            {distance_miles}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">miles</span>
        </div>
      </div>

      {/* Grouped Risk Stat Badges (Pills on Grid) */}
      <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
        <div className="py-1 px-1.5 rounded-lg bg-red-50/50 border border-red-200/80">
          <span className="text-red-700 text-[10px] block font-sans font-semibold">Severe</span>
          <span className={`text-xs font-bold ${summary.severe_miles > 0 ? "text-red-700" : "text-slate-500"}`}>
            {summary.severe_miles} mi
          </span>
        </div>

        <div className="py-1 px-1.5 rounded-lg bg-amber-50/50 border border-amber-200/80">
          <span className="text-amber-700 text-[10px] block font-sans font-semibold">High</span>
          <span className={`text-xs font-bold ${summary.high_miles > 0 ? "text-amber-700" : "text-slate-500"}`}>
            {summary.high_miles} mi
          </span>
        </div>

        <div className="py-1 px-1.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
          <span className="text-emerald-700 text-[10px] block font-sans font-semibold">Avg Risk</span>
          <span className="text-xs font-bold text-emerald-800">
            {summary.average_risk.toFixed(1)}/5
          </span>
        </div>
      </div>
    </div>
  );
};
