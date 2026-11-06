import React from "react";
import { BarChart2, Clock, Navigation, Shield, ArrowRight, Truck } from "lucide-react";
import { RouteOption } from "../types";

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
  if (!routes || routes.length === 0) return null;

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 shadow-sm select-none">
      {/* Section Header: Icon + "Route Comparison" */}
      <div className="flex items-center space-x-2 mb-3 px-1">
        <BarChart2 className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
          Route Comparison
        </h3>
      </div>

      {/* Main Grid: 3 Route Cards + Proceed Button */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* The 3 Alternative Route Cards (spanning 10 cols) */}
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

            return (
              <div
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                className={`cursor-pointer rounded-2xl p-3.5 transition border shadow-2xs ${
                  route.is_recommended
                    ? "bg-white border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                    : isSelected
                    ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Top Row: #Rank + Route Name + Recommended Badge */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-900">
                      #{route.rank}
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 tracking-tight truncate max-w-[140px]">
                      {route.name}
                    </span>
                  </div>

                  {route.is_recommended && (
                    <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[9px] font-bold shrink-0">
                      Recommended
                    </span>
                  )}
                </div>

                {/* Metrics + Mini Risk Matrix */}
                <div className="flex items-center justify-between gap-1">
                  {/* Left Metrics: ETA & Distance */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-700" />
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        {hours}h {minutes}m
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">ETA</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-slate-700 rotate-45" />
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        {route.distance_miles} mi
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">Distance</span>
                    </div>

                    {route.rank === 3 && (
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-slate-700" />
                        <span className="text-[10px] font-bold text-slate-700 font-mono">
                          Avg Risk {route.summary?.average_risk?.toFixed(1)} / 5
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Risk Dots Table */}
                  <div className="space-y-0.5 text-[10px] font-mono shrink-0 pl-2 border-l border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="text-[9px] text-slate-500 font-sans">Severe</span>
                      </div>
                      <span className="font-semibold text-slate-600">
                        {route.summary?.severe_miles || 0} mi
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                        <span className="text-[9px] text-slate-500 font-sans">High</span>
                      </div>
                      <span className="font-semibold text-slate-600">
                        {route.summary?.high_miles || 0} mi
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-slate-500 font-sans">Low/Mod</span>
                      </div>
                      <span className="text-slate-600">
                        {lowModMiles} mi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Proceed with Selected Route Button (spanning 2 cols) */}
        <div className="col-span-12 md:col-span-2 flex items-center justify-end relative pl-1">
          {/* Artistic curved amber/orange flourish wave */}
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
            className="w-full py-3 px-4 rounded-2xl bg-[#101c38] hover:bg-[#0c162c] text-white flex flex-col items-center justify-center shadow-md transition hover:shadow-lg active:scale-95 group"
          >
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition" />
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
