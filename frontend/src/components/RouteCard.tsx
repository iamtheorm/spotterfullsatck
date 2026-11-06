import React from "react";
import { Clock, Navigation, Shield, CheckCircle2 } from "lucide-react";
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

  // Compute Low/Mod miles
  const lowModMiles = Math.max(
    0,
    Math.round(distance_miles - (summary.severe_miles || 0) - (summary.high_miles || 0))
  );

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl p-4 transition border shadow-xs select-none ${
        isSelected
          ? is_recommended
            ? "bg-emerald-50/30 border-emerald-400 ring-2 ring-emerald-500/20 shadow-md"
            : "bg-blue-50/30 border-blue-400 ring-2 ring-blue-500/20 shadow-md"
          : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      {/* Top Row: Badge + Name + Recommended Pill */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs ${
              is_recommended ? "bg-emerald-600" : "bg-blue-600"
            }`}
          >
            #{rank}
          </span>
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            {name}
          </span>
        </div>

        {is_recommended && (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Recommended</span>
          </span>
        )}
      </div>

      {/* Main Content: 3 Stats on Left + Risk Mileage Table on Right */}
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Left Side: ETA, Distance, Avg Risk (8 cols) */}
        <div className="col-span-8 flex items-center justify-between border-r border-slate-100 pr-3">
          {/* ETA */}
          <div>
            <div className="flex items-center gap-1 text-slate-800 font-bold text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{hours}h {minutes}m</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium ml-4">ETA</span>
          </div>

          {/* Distance */}
          <div>
            <div className="flex items-center gap-1 text-slate-800 font-bold text-xs font-mono">
              <Navigation className="w-3.5 h-3.5 text-slate-500 rotate-45" />
              <span>{distance_miles} mi</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium ml-4">Distance</span>
          </div>

          {/* Avg Risk */}
          <div>
            <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Avg Risk</span>
            </div>
            <span className="text-[10px] font-bold text-slate-700 font-mono ml-4">
              {summary.average_risk.toFixed(1)} / 5
            </span>
          </div>
        </div>

        {/* Right Side: Severe / High / Low-Mod Dots & Mileage (4 cols) */}
        <div className="col-span-4 pl-1 space-y-1 font-mono text-[11px]">
          {/* Severe */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-[10px] text-slate-600 font-sans">Severe</span>
            </div>
            <span className={`font-semibold ${summary.severe_miles > 0 ? "text-red-600 font-bold" : "text-slate-500"}`}>
              {summary.severe_miles} mi
            </span>
          </div>

          {/* High */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[10px] text-slate-600 font-sans">High</span>
            </div>
            <span className={`font-semibold ${summary.high_miles > 0 ? "text-amber-600 font-bold" : "text-slate-500"}`}>
              {summary.high_miles} mi
            </span>
          </div>

          {/* Low/Mod */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-slate-600 font-sans">Low/Mod</span>
            </div>
            <span className="text-slate-700 font-medium">
              {lowModMiles} mi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
