import React from "react";
import { Bell, Shield } from "lucide-react";

interface HeaderProps {
  onOpenRules: () => void;
  onSelectPreset: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRules,
  onSelectPreset,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 relative z-30 select-none shadow-2xs">
      {/* Top Window Bar (macOS Chrome-like aesthetic from screenshot) */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100/90 border-b border-slate-200/60 text-xs">
        <div className="flex items-center space-x-2">
          {/* Window control dots */}
          <div className="flex items-center space-x-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>

          {/* Active Window Tab */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-t-lg border-t border-x border-slate-200 shadow-2xs text-slate-800 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>Weather-Aware Truck Routing</span>
            <span className="text-slate-400 font-bold ml-1 hover:text-slate-700 cursor-pointer">+</span>
          </div>
        </div>

        {/* Quick Presets & Rules in Top Bar */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-500 font-medium hidden md:inline">Presets:</span>
          <button
            type="button"
            onClick={() => onSelectPreset("Chicago, IL", "Dallas, TX", 34000)}
            className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium border border-slate-200 transition"
          >
            Midwest
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset("Delhi, India", "Kanpur, India", 34000)}
            className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium border border-slate-200 transition"
          >
            Delhi → Kanpur
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset("Delhi, India", "Lucknow, India", 34000)}
            className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium border border-slate-200 transition"
          >
            Delhi → Lucknow
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset("Atlanta, GA", "Miami, FL", 28000)}
            className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium border border-slate-200 transition"
          >
            Southeast
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-medium transition hover:bg-slate-800 ml-1"
          >
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Rules</span>
          </button>
        </div>
      </div>

      {/* Main Banner Header matching screenshot */}
      <div className="relative h-20 md:h-24 px-6 flex items-center justify-between overflow-hidden bg-gradient-to-r from-white via-sky-50/20 to-transparent">
        {/* Left Side: Brand Title & Tagline with brush curve underline */}
        <div className="z-10 py-2">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Weather-Aware Truck Routing
          </h1>
          <div className="relative inline-block mt-0.5">
            <p className="text-xs md:text-sm font-medium text-slate-600">
              Plan smarter. Deliver safer.
            </p>
            {/* Orange curve brush stroke accent under "safer" */}
            <svg
              className="absolute -bottom-1.5 right-0 w-24 h-2 text-amber-500 overflow-visible"
              viewBox="0 0 100 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 7C30 2 70 3 98 6"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Right Side: Panoramic Semi-Truck Highway Photo + Bell + Avatar */}
        <div className="absolute top-0 right-0 h-full w-2/3 md:w-1/2 flex items-center justify-end pointer-events-none">
          {/* Panoramic truck background image with soft fade on left */}
          <div
            className="absolute inset-0 bg-cover bg-right"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80')",
              maskImage: "linear-gradient(to right, transparent 0%, black 40%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)",
            }}
          />

          {/* User controls on top right */}
          <div className="relative z-20 flex items-center space-x-3 mr-6 pointer-events-auto">
            {/* Notification Bell with red badge */}
            <button
              type="button"
              className="relative p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 transition backdrop-blur-xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>

            {/* Profile Avatar "R" */}
            <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-white text-white font-bold text-sm flex items-center justify-center shadow-md">
              R
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
