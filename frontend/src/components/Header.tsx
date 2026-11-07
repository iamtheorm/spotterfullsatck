import React from "react";
import { Settings } from "lucide-react";

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200/90 relative z-30 select-none overflow-hidden shrink-0 shadow-2xs">
      <div className="h-16 px-6 flex items-center justify-between bg-white">
        {/* Left Side: Brand Logo, Title, Tagline */}
        <div className="flex items-center space-x-3.5">
          {/* Commercial Vector Truck Logo */}
          <div className="relative flex items-center justify-center">
            <svg
              className="w-10 h-7 text-[#101c38]"
              viewBox="0 0 54 38"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Amber Speed Streaks */}
              <path d="M1 9H18L15 13H1L1 9Z" fill="#f59e0b" className="opacity-90" />
              <path d="M4 16H22L19 20H4L4 16Z" fill="#f59e0b" className="opacity-80" />
              <path d="M1 23H16L13 27H1L1 23Z" fill="#f59e0b" className="opacity-70" />
              {/* Semi-Trailer */}
              <rect x="12" y="6" width="23" height="21" rx="2" fill="#101c38" />
              {/* Tractor Cabin */}
              <path
                d="M34 11H41.5C42.3 11 43.1 11.3 43.6 11.9L49.4 17.7C49.8 18.1 50 18.7 50 19.3V27H34V11Z"
                fill="#1e293b"
              />
              {/* Windshield */}
              <path d="M38 13H42L47 18H38V13Z" fill="#38bdf8" className="opacity-90" />
              {/* Wheels */}
              <circle cx="19" cy="28" r="4.5" fill="#0f172a" />
              <circle cx="19" cy="28" r="2" fill="#ffffff" />
              <circle cx="43" cy="28" r="4.5" fill="#0f172a" />
              <circle cx="43" cy="28" r="2" fill="#ffffff" />
            </svg>
          </div>

          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight font-sans leading-tight">
              Weather-Aware Truck Routing
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Plan smarter. Deliver safer.
            </p>
          </div>
        </div>

        {/* Right Side: Single Gear Icon for Settings */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition shadow-2xs active:scale-95"
            title="Settings & Risk Rules"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>
    </header>
  );
};
