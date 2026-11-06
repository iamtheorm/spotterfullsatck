import React from "react";
import { X, ShieldAlert, AlertTriangle, Wind, CloudRain, Snowflake, CheckCircle2 } from "lucide-react";

interface RiskRulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskRulesDrawer: React.FC<RiskRulesDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black/75 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto h-full shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Risk Rules & Load Logic</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Condition Thresholds Table */}
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>1. Condition Thresholds</span>
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3 text-emerald-400 font-semibold">Low (1)</th>
                    <th className="py-2.5 px-3 text-yellow-400 font-semibold">Moderate (2)</th>
                    <th className="py-2.5 px-3 text-orange-400 font-semibold">High (3)</th>
                    <th className="py-2.5 px-3 text-red-400 font-semibold">Severe (4)</th>
                    <th className="py-2.5 px-3 text-slate-100 font-semibold">No Travel (5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-white flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind
                    </td>
                    <td className="py-2 px-3">&lt; 25 mph</td>
                    <td className="py-2 px-3">25–34</td>
                    <td className="py-2 px-3">35–44</td>
                    <td className="py-2 px-3">45–54</td>
                    <td className="py-2 px-3 font-bold text-red-400">≥ 55 mph</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-white flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain
                    </td>
                    <td className="py-2 px-3">&lt; 0.10 in/hr</td>
                    <td className="py-2 px-3">0.10–0.25</td>
                    <td className="py-2 px-3">0.25–0.50</td>
                    <td className="py-2 px-3">0.50–1.00</td>
                    <td className="py-2 px-3 font-bold text-red-400">&gt; 1.00 in/hr</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-medium text-white flex items-center gap-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-indigo-300" /> Snow
                    </td>
                    <td className="py-2 px-3">&lt; 0.5 in/hr</td>
                    <td className="py-2 px-3">0.5–1.0</td>
                    <td className="py-2 px-3">1.0–2.0</td>
                    <td className="py-2 px-3">2.0–3.0</td>
                    <td className="py-2 px-3 font-bold text-red-400">&gt; 3.0 in/hr</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Load Rules Overrides */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>2. Specific Load Rules (Overrides)</span>
              </h3>
              <div className="space-y-2.5">
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs">
                  <div className="font-semibold text-red-300 flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Wind ≥ 55 mph → No Travel
                  </div>
                  <p className="text-slate-300">
                    Triggers mandatory <strong>No Travel</strong> status for any load weight regardless of configuration.
                  </p>
                </div>

                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Wind 45–54 mph + Load Weight &gt; 30,000 lb → No Travel
                  </div>
                  <p className="text-slate-300">
                    Elevates checkpoint risk from Severe to <strong>No Travel</strong> when carrying loads over 30,000 lbs in 45–54 mph crosswinds.
                  </p>
                </div>

                <div className="p-3 bg-orange-950/40 border border-orange-800/60 rounded-lg text-xs">
                  <div className="font-semibold text-orange-300 flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Wind 35–44 mph + Load Weight &gt; 40,000 lb → Severe
                  </div>
                  <p className="text-slate-300">
                    Elevates checkpoint risk from High to <strong>Severe</strong> when hauling heavy freight exceeding 40,000 lbs.
                  </p>
                </div>
              </div>
            </div>

            {/* Route Recommendation Engine */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>3. Route Recommendation Ranking Priority</span>
              </h3>
              <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside bg-slate-800/40 p-4 rounded-lg border border-slate-800">
                <li className="font-medium text-emerald-300">
                  <strong>Fewest Severe miles</strong> (primary safety barrier)
                </li>
                <li className="font-medium text-emerald-300">
                  <strong>Fewest High miles</strong> (secondary hazard mitigation)
                </li>
                <li className="font-medium text-slate-200">
                  <strong>Lowest average risk</strong> score across all checkpoints
                </li>
                <li className="font-medium text-slate-200">
                  <strong>Shortest travel time</strong> (operational efficiency)
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs tracking-wide transition shadow"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

