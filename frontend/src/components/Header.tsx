import React, { useState } from "react";
import { Volume2, VolumeX, Shield, Radio, Sparkles } from "lucide-react";
import { playTruckAirHorn } from "../utils/audio";

interface HeaderProps {
  onOpenRules?: () => void;
  onSelectPreset?: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules }) => {
  const [isHonking, setIsHonking] = useState(false);

  const handleHornClick = () => {
    setIsHonking(true);
    playTruckAirHorn();
    setTimeout(() => setIsHonking(false), 900);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200/90 relative z-30 select-none overflow-hidden shrink-0 shadow-2xs">
      <div className="relative h-20 md:h-[84px] px-6 flex items-center justify-between overflow-hidden bg-gradient-to-r from-white via-slate-50/50 to-transparent">
        {/* Left Side: Brand Logo, Title, Tagline, and Fleet Status */}
        <div className="flex items-center space-x-4 z-10 py-2">
          {/* Animated 3D/Vector Truck Logo */}
          <div className="relative flex items-center justify-center">
            <svg
              className="w-12 h-9 text-[#101c38]"
              viewBox="0 0 54 38"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Amber Speed Streaks behind truck */}
              <path
                d="M1 9H18L15 13H1L1 9Z"
                fill="#f59e0b"
                className="animate-pulse opacity-90"
              />
              <path
                d="M4 16H22L19 20H4L4 16Z"
                fill="#f59e0b"
                className="animate-pulse opacity-80"
              />
              <path
                d="M1 23H16L13 27H1L1 23Z"
                fill="#f59e0b"
                className="animate-pulse opacity-70"
              />
              {/* Semi-Trailer */}
              <rect x="12" y="6" width="23" height="21" rx="2" fill="#101c38" />
              {/* Tractor Cabin */}
              <path
                d="M34 11H41.5C42.3 11 43.1 11.3 43.6 11.9L49.4 17.7C49.8 18.1 50 18.7 50 19.3V27H34V11Z"
                fill="#1e293b"
              />
              {/* Windshield */}
              <path
                d="M38 13H42L47 18H38V13Z"
                fill="#38bdf8"
                className="opacity-90"
              />
              {/* Wheels */}
              <circle cx="19" cy="28" r="4.5" fill="#0f172a" />
              <circle cx="19" cy="28" r="2" fill="#ffffff" />
              <circle cx="43" cy="28" r="4.5" fill="#0f172a" />
              <circle cx="43" cy="28" r="2" fill="#ffffff" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-[22px] font-black text-slate-900 tracking-tight font-sans leading-none">
                Weather-Aware Truck Routing
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Fleet Dispatch</span>
              </span>
            </div>

            <div className="relative inline-block mt-1">
              <p className="text-xs md:text-sm font-semibold text-slate-600">
                Plan smarter. Deliver safer.
              </p>
              {/* Amber curved flourish stroke */}
              <svg
                className="absolute -bottom-1.5 right-0 w-28 h-2.5 text-amber-500 overflow-visible"
                viewBox="0 0 110 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8C35 2 75 3 108 7"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Center: Live Highway Flow Simulation with Animated Moving Truck */}
        <div className="hidden lg:flex items-center space-x-3 z-10 px-4 py-1.5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-2xs backdrop-blur-xs">
          {/* Animated SVG Truck Driving on Highway */}
          <div className="relative w-28 h-9 overflow-hidden flex items-center justify-center bg-slate-900 rounded-xl px-2">
            {/* Animated Road Lane Dashes */}
            <div className="absolute bottom-1.5 left-0 right-0 h-[2px] flex items-center justify-around opacity-60">
              <div className="w-3 h-[2px] bg-amber-400 animate-pulse"></div>
              <div className="w-3 h-[2px] bg-amber-400 animate-pulse"></div>
              <div className="w-3 h-[2px] bg-amber-400 animate-pulse"></div>
            </div>

            {/* Bouncing Moving Truck Silhouette with Headlights */}
            <div className="relative z-10 animate-truck-bounce flex items-center">
              <svg className="w-16 h-6 text-sky-400" viewBox="0 0 48 20" fill="currentColor">
                <rect x="2" y="3" width="26" height="12" rx="1" fill="#38bdf8" />
                <path d="M28 6H36L42 11V15H28V6Z" fill="#bae6fd" />
                <circle cx="8" cy="16" r="2.5" fill="#0f172a" />
                <circle cx="8" cy="16" r="1" fill="#ffffff" />
                <circle cx="22" cy="16" r="2.5" fill="#0f172a" />
                <circle cx="22" cy="16" r="1" fill="#ffffff" />
                <circle cx="36" cy="16" r="2.5" fill="#0f172a" />
                <circle cx="36" cy="16" r="1" fill="#ffffff" />
              </svg>
              {/* Headlight beam */}
              <div className="w-6 h-3 bg-gradient-to-r from-amber-300/80 to-transparent rounded-r-full blur-[1px]"></div>
            </div>
          </div>

          <div className="text-[11px] leading-tight">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Real-Time Radar</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Class 8 Gross Routing</span>
          </div>
        </div>

        {/* Right Side: Air Horn Button + Panoramic Truck Photography */}
        <div className="flex items-center space-x-3.5 z-10">
          {/* Interactive Pneumatic Truck Air Horn Button */}
          <button
            type="button"
            onClick={handleHornClick}
            className={`relative px-3.5 py-2 rounded-2xl transition flex items-center gap-2 border shadow-xs active:scale-95 ${
              isHonking
                ? "bg-amber-500 text-white border-amber-600 shadow-md ring-4 ring-amber-300"
                : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
            }`}
            title="Click to honk commercial truck pneumatic air horn"
          >
            {isHonking && (
              <span className="absolute -inset-1 rounded-2xl bg-amber-400 opacity-60 animate-horn-ripple pointer-events-none"></span>
            )}
            <Volume2 className={`w-4 h-4 ${isHonking ? "text-white animate-bounce" : "text-amber-500"}`} />
            <div className="text-left font-sans">
              <div className="text-[11px] font-bold leading-none">Air Horn</div>
              <div className="text-[9px] text-slate-400 leading-none mt-0.5 font-mono">Pneumatic 📢</div>
            </div>
          </button>

          {/* Rules Modal Trigger */}
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Risk Rules</span>
            </button>
          )}

          {/* Panoramic High-Res Truck Photo Thumbnail */}
          <div className="w-28 md:w-36 h-12 rounded-xl overflow-hidden shadow-xs border border-slate-200/80 relative hidden sm:block">
            <img
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80"
              alt="Class 8 Truck on Highway"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-1">
              <span className="text-[9px] font-bold text-white drop-shadow-sm font-mono">CLASS 8 GVWR</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
