import React from "react";
import { Settings } from "lucide-react";

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 relative z-30 select-none shrink-0 shadow-2xs">
      <div className="h-14 px-5 flex items-center justify-between bg-white">
        {/* Left Side: Brand Logo, Title, Tagline */}
        <div className="flex items-center space-x-3.5">
          {/* SafeCorridor Brand Shield Logo */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              className="w-9 h-9"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="headerShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="headerEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              {/* Outer Protective Shield Badge */}
              <path
                d="M24 3L6 10.5V23C6 34.5 13.8 44.5 24 47C34.2 44.5 42 34.5 42 23V10.5L24 3Z"
                fill="url(#headerShieldGrad)"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Highway Corridor Perspective Track */}
              <path
                d="M16 38L21 21H27L32 38"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M24 23V36"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="2 3"
                strokeLinecap="round"
              />
              {/* Class 8 Cab Front */}
              <rect x="18" y="14" width="12" height="10" rx="2" fill="url(#headerEmeraldGrad)" />
              <rect x="20" y="16" width="8" height="3" rx="1" fill="#0f172a" />
              <circle cx="20" cy="21.5" r="1.2" fill="#fef08a" />
              <circle cx="28" cy="21.5" r="1.2" fill="#fef08a" />
              <rect x="22" y="21" width="4" height="2" rx="0.5" fill="#f8fafc" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-serif leading-tight">
              SafeCorridor
            </h1>
            <p className="text-xs font-medium text-slate-500 tracking-tight font-sans">
              Weather-Aware Freight Intelligence
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
