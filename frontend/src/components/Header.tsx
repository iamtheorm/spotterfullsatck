import React from "react";
import { Truck, ShieldAlert, Sparkles, CloudSun } from "lucide-react";

interface HeaderProps {
  onOpenRules: () => void;
  onSelectPreset: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onSelectPreset }) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Weather-Aware Truck Routing
              </h1>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                DRF + React
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Corridor risk analysis, dynamic weather forecasting & multi-criteria route ranking
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick presets */}
          <div className="flex items-center space-x-1 text-xs text-slate-400 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Presets:</span>
            <button
              type="button"
              onClick={() => onSelectPreset("Chicago, IL", "Dallas, TX", 34000)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            >
              Midwest Corridor
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Denver, CO", "Kansas City, MO", 42000)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            >
              High Plains Wind
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Atlanta, GA", "Miami, FL", 28000)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            >
              Southeast Wet
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Risk & Load Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
};

