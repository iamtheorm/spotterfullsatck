import React from "react";
import { Clock, Navigation, Shield, ArrowRight } from "lucide-react";
import { RouteOption } from "../types";

interface BottomActionBarProps {
  route?: RouteOption;
  onProceed?: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  route,
  onProceed,
}) => {
  if (!route) return null;

  const hours = Math.floor(route.duration_hours);
  const minutes = Math.round((route.duration_hours - hours) * 60);

  return (
    <div className="w-full bg-white border-t border-slate-200/90 px-6 py-2.5 flex items-center justify-between shadow-lg z-30 select-none">
      {/* Left: Thumbnail of Semi-Truck on Highway */}
      <div className="flex items-center space-x-3">
        <div className="w-20 h-10 rounded-xl overflow-hidden shadow-xs border border-slate-200 relative group hidden sm:block">
          <img
            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=300&q=80"
            alt="Truck"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition"
          />
        </div>
      </div>

      {/* Center: Total ETA, Total Distance, Avg Risk */}
      <div className="flex items-center space-x-6 md:space-x-12">
        {/* Total ETA */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm md:text-base font-extrabold text-slate-900 font-mono">
              {hours}h {minutes}m
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Total ETA</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-7 w-[1px] bg-slate-200 hidden md:block"></div>

        {/* Total Distance */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
            <Navigation className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <div className="text-sm md:text-base font-extrabold text-slate-900 font-mono">
              {route.distance_miles} mi
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Total Distance</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-7 w-[1px] bg-slate-200 hidden md:block"></div>

        {/* Avg Risk */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm md:text-base font-extrabold text-slate-900 font-mono">
              {route.summary?.average_risk?.toFixed(1) || "1.0"} / 5
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Avg Risk</div>
          </div>
        </div>
      </div>

      {/* Right: Proceed with Route Button matching screenshot */}
      <div className="flex items-center space-x-3">
        {/* Subtle orange/navy flourish curve */}
        <svg
          className="w-16 h-8 text-amber-500 hidden lg:block"
          viewBox="0 0 100 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 35C40 35 60 5 95 5"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        <button
          type="button"
          onClick={onProceed}
          className="py-2.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm flex items-center space-x-2 shadow-md transition hover:shadow-lg active:scale-95"
        >
          <span>Proceed with Route</span>
          <ArrowRight className="w-4 h-4 text-sky-400" />
        </button>
      </div>
    </div>
  );
};

