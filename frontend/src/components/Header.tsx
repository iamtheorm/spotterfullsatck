import React from "react";
import { Truck, Shield, Sparkles } from "lucide-react";

interface HeaderProps {
  onOpenRules: () => void;
  onSelectPreset: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onSelectPreset }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 z-30 flex-shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-semibold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-tight text-white">
                Weather-Aware Truck Routing
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                PRO DISPATCH
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick presets */}
          <div className="flex items-center space-x-1 text-xs text-slate-400 mr-2">
            <span className="text-[11px] text-slate-500 font-medium mr-1 hidden md:inline">Presets:</span>
            <button
              type="button"
              onClick={() => onSelectPreset("Chicago, IL", "Dallas, TX", 34000)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700/80 transition"
            >
              Midwest
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Denver, CO", "Kansas City, MO", 42000)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700/80 transition"
            >
              High Plains
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Atlanta, GA", "Miami, FL", 28000)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700/80 transition"
            >
              Southeast
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
};
