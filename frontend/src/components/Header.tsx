import React from "react";
import { Truck, Shield, Radio } from "lucide-react";

interface HeaderProps {
  onOpenRules: () => void;
  onSelectPreset: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onSelectPreset }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-5 py-2 z-30 flex-shrink-0 shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        {/* Logo & Active Dispatcher Status */}
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold shadow-xs">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold tracking-tight text-slate-900">
              Weather-Aware Truck Routing
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Dispatch Console
            </span>
          </div>
        </div>

        {/* Actions: Presets & Rules Matrix */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-slate-500 mr-2">
            <span className="text-[11px] font-medium mr-1 hidden sm:inline text-slate-400">Presets:</span>
            <button
              type="button"
              onClick={() => onSelectPreset("Chicago, IL", "Dallas, TX", 34000)}
              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 transition"
            >
              Midwest
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Denver, CO", "Kansas City, MO", 42000)}
              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 transition"
            >
              High Plains
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Atlanta, GA", "Miami, FL", 28000)}
              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 transition"
            >
              Southeast
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
};
