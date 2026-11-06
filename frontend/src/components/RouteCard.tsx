import React from "react";
import { Clock, Navigation, Shield } from "lucide-react";
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
        is_recommended
          ? "bg-[#f0fdf4]/60 border-emerald-300 ring-1 ring-emerald-500/20 shadow-xs"
          : isSelected
          ? "bg-blue-50/40 border-blue-400 ring-1 ring-blue-500/20 shadow-xs"
          : "bg-white border-slate-200/90 hover:border-slate-300"
      }`}
    >
      {/* Top Row: Badge + Name + Recommended Pill */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2.5">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-2xs ${
              rank === 1 ? "bg-[#16a34a]" : "bg-[#2563eb]"
            }`}
          >
            #{rank}
          </span>
          <span className="text-xs font-bold text-slate-900 tracking-tight font-sans">
            {name}
          </span>
        </div>

        {is_recommended && (
          <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-bold">
            Recommended
          </span>
        )}
      </div>

      {/* Main Content: 3 Stats on Left + Risk Mileage Table on Right */}
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Left Side: ETA, Distance, Avg Risk (8 cols) */}
        <div className="col-span-8 flex items-center justify-between border-r border-slate-200/70 pr-3">
          {/* ETA */}
          <div>
            <div className="flex items-center gap-1 text-slate-900 font-extrabold text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <span>{hours}h {minutes}m</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold ml-4">ETA</span>
          </div>

          {/* Distance */}
          <div>
            <div className="flex items-center gap-1 text-slate-900 font-extrabold text-xs font-mono">
              <Navigation className="w-3.5 h-3.5 text-slate-700 rotate-45" />
              <span>{distance_miles} mi</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold ml-4">Distance</span>
          </div>

          {/* Avg Risk */}
          <div>
            <div className="flex items-center gap-1 text-slate-900 font-extrabold text-xs">
              <Shield className="w-3.5 h-3.5 text-slate-700" />
              <span>Avg Risk</span>
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 font-mono ml-4 block">
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
              <span className="text-[10px] text-slate-600 font-sans font-medium">Severe</span>
            </div>
            <span className={`font-semibold ${summary.severe_miles > 0 ? "text-red-600 font-bold" : "text-slate-600"}`}>
              {summary.severe_miles} mi
            </span>
          </div>

          {/* High */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span className="text-[10px] text-slate-600 font-sans font-medium">High</span>
            </div>
            <span className={`font-semibold ${summary.high_miles > 0 ? "text-orange-500 font-bold" : "text-slate-600"}`}>
              {summary.high_miles} mi
            </span>
          </div>

          {/* Low/Mod */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-slate-600 font-sans font-medium">Low/Mod</span>
            </div>
            <span className="text-slate-600 font-medium">
              {lowModMiles} mi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
