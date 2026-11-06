import React from "react";
import { Truck, Shield } from "lucide-react";

interface HeaderProps {
  onOpenRules: () => void;
  onSelectPreset: (origin: string, dest: string, weight: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRules, onSelectPreset }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-5 py-2.5 z-30 flex-shrink-0 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900">
                Weather-Aware Truck Routing
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                ENTERPRISE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick presets */}
          <div className="flex items-center space-x-1 text-xs text-slate-500 mr-2">
            <span className="text-[11px] font-medium mr-1 hidden md:inline text-slate-400">Presets:</span>
            <button
              type="button"
              onClick={() => onSelectPreset("Chicago, IL", "Dallas, TX", 34000)}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 transition shadow-2xs"
            >
              Midwest
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Denver, CO", "Kansas City, MO", 42000)}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 transition shadow-2xs"
            >
              High Plains
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset("Atlanta, GA", "Miami, FL", 28000)}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200 transition shadow-2xs"
            >
              Southeast
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Rules Matrix</span>
          </button>
        </div>
      </div>
    </header>
  );
};
