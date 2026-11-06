import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Milestone,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Flame,
} from "lucide-react";
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
      className={`relative cursor-pointer rounded-xl p-4 transition-all border ${
        isSelected
          ? is_recommended
            ? "bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/30"
            : "bg-slate-800/90 border-blue-500 shadow-lg shadow-blue-950/40 ring-2 ring-blue-500/30"
          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
      }`}
    >
      {/* Top row: Rank, Recommendation badge, Duration */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              is_recommended
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}
          >
            #{rank}
          </span>
          <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1">
            {name}
          </h3>
        </div>

        {is_recommended && (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 uppercase tracking-wider animate-pulse">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Recommended</span>
          </span>
        )}
      </div>

      {/* No Travel Warning */}
      {summary.has_no_travel && (
        <div className="mb-2.5 px-2.5 py-1.5 rounded-md bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="font-semibold">
            Warning: Contains {summary.no_travel_miles} mi of No-Travel conditions!
          </span>
        </div>
      )}

      {/* Key Stats row */}
      <div className="grid grid-cols-2 gap-2 my-2.5 py-2 px-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {hours}h {minutes}m
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <Milestone className="w-3.5 h-3.5 text-slate-400" />
          <span>{distance_miles} miles</span>
        </div>
      </div>

      {/* Weather Risk Breakdown */}
      <div className="space-y-1.5 pt-1 text-xs">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>Weather Exposure Profile</span>
          <span className="font-mono text-slate-300">
            Avg Risk:{" "}
            <span
              className={`font-bold ${
                summary.average_risk > 3
                  ? "text-red-400"
                  : summary.average_risk > 2
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {summary.average_risk.toFixed(1)} / 5
            </span>
          </span>
        </div>

        {/* Hazard badges */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="p-1.5 rounded bg-red-950/30 border border-red-900/50 text-center">
            <span className="block text-[10px] text-red-400 font-medium">Severe</span>
            <span className="text-xs font-bold text-red-200 font-mono">
              {summary.severe_miles} mi
            </span>
          </div>

          <div className="p-1.5 rounded bg-amber-950/30 border border-amber-900/50 text-center">
            <span className="block text-[10px] text-amber-400 font-medium">High</span>
            <span className="text-xs font-bold text-amber-200 font-mono">
              {summary.high_miles} mi
            </span>
          </div>

          <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-900/50 text-center">
            <span className="block text-[10px] text-emerald-400 font-medium">Low / Mod</span>
            <span className="text-xs font-bold text-emerald-200 font-mono">
              {(summary.low_miles + summary.moderate_miles).toFixed(0)} mi
            </span>
          </div>
        </div>
      </div>

      {/* View Checkpoints button hint */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>{route.checkpoints.length} Weather Checkpoints</span>
        <span className="flex items-center gap-0.5 text-slate-300 font-medium">
          {isSelected ? "Active on map" : "Click to view"}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

