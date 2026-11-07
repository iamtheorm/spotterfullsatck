import React from "react";
import {
  BarChart2,
  Clock,
  Navigation,
  Shield,
  Truck,
  Fuel,
  Volume2,
} from "lucide-react";
import { RouteOption } from "../types";
import { playTruckAirHorn } from "../utils/audio";

interface BottomRouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  onProceed?: () => void;
}

export const BottomRouteComparison: React.FC<BottomRouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onProceed,
}) => {
  if (!routes || routes.length === 0) {
    return (
      <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-sm select-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-sky-400 shadow-sm animate-pulse">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Fleet Dispatch Standby</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Enter origin and destination above or select a preset, then click <strong className="text-slate-800">"Evaluate 3 Routes"</strong> to analyze weather risk.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => playTruckAirHorn()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              title="Test Truck Pneumatic Air Horn"
            >
              <Volume2 className="w-4 h-4 text-amber-500" />
              <span>Air Horn 📢</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 shadow-sm select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-tight">
            Route Comparison & Class 8 Feasibility
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium hidden sm:flex">
          <span className="flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-amber-500" />
            <span>Est. Diesel ($3.85/gal @ 6.5 MPG)</span>
          </span>
        </div>
      </div>

      {/* Main Grid: 3 Route Cards + Proceed Button */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* The 3 Alternative Route Cards */}
        <div className="col-span-12 md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-3">
          {routes.slice(0, 3).map((route) => {
            const isSelected = route.id === selectedRouteId;
            const hours = Math.floor(route.duration_hours);
            const minutes = Math.round((route.duration_hours - hours) * 60);

            const lowModMiles = Math.max(
              0,
              Math.round(
                route.distance_miles -
                  (route.summary?.severe_miles || 0) -
                  (route.summary?.high_miles || 0)
              )
            );

            // Estimated diesel fuel cost
            const gallons = route.distance_miles / 6.5;
            const fuelCost = Math.round(gallons * 3.85);

            return (
              <div
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                className={`cursor-pointer rounded-2xl p-3.5 transition border shadow-2xs flex flex-col justify-between ${
                  route.is_recommended
                    ? "bg-[#f0fdf4]/50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                    : isSelected
                    ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Top Row: #Rank + Dynamic Route Name + Recommended Badge */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="flex items-start space-x-1.5 flex-1 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${
                        route.rank === 1 ? "bg-[#16a34a]" : "bg-[#2563eb]"
                      }`}
                    >
                      #{route.rank}
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 min-h-[28px]" title={route.name}>
                      {route.name}
                    </span>
                  </div>

                  {route.is_recommended && (
                    <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[9px] font-bold shrink-0 ml-1">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Metrics + Mini Risk Matrix */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  {/* Left Metrics: ETA & Distance & Fuel */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {hours}h {minutes}m
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">ETA</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-slate-600 rotate-45" />
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {route.distance_miles} mi
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">Distance</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <Fuel className="w-3 h-3 text-amber-500" />
                      <span>~${fuelCost} Fuel</span>
                    </div>
                  </div>

                  {/* Right Side: Risk Exposure Matrix */}
                  <div className="space-y-0.5 text-[10px] font-mono shrink-0 pl-2.5 border-l border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="text-[9px] text-slate-600 font-sans">Severe</span>
                      </div>
                      <span className={`font-bold ${route.summary?.severe_miles > 0 ? "text-red-600" : "text-slate-500"}`}>
                        {route.summary?.severe_miles || 0} mi
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                        <span className="text-[9px] text-slate-600 font-sans">High</span>
                      </div>
                      <span className={`font-bold ${route.summary?.high_miles > 0 ? "text-orange-500" : "text-slate-500"}`}>
                        {route.summary?.high_miles || 0} mi
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-slate-600 font-sans">Low/Mod</span>
                      </div>
                      <span className="text-slate-600 font-medium">
                        {lowModMiles} mi
                      </span>
                    </div>

                    <div className="pt-0.5 text-[9px] font-bold text-slate-500 font-sans text-right">
                      Avg: {route.summary?.average_risk?.toFixed(1) || "1.0"}/5
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Proceed with Selected Route Button */}
        <div className="col-span-12 md:col-span-2 flex items-center justify-end relative pl-1">
          {/* Amber flourish curve */}
          <svg
            className="w-16 h-12 text-amber-500 absolute -left-6 top-1 hidden xl:block overflow-visible"
            viewBox="0 0 100 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 35C35 35 60 8 98 8"
              stroke="#f59e0b"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </svg>

          <button
            type="button"
            onClick={onProceed}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#101c38] hover:bg-[#0c162c] text-white flex flex-col items-center justify-center shadow-md transition hover:shadow-lg active:scale-95 group"
          >
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition duration-200" />
              <span className="font-extrabold text-xs">Proceed</span>
            </div>
            <span className="text-[9px] text-slate-300 font-medium whitespace-nowrap">
              with Selected Route →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
