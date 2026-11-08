import React from "react";
import { X, ShieldAlert, AlertTriangle, Wind, CloudRain, Snowflake, CheckCircle2 } from "lucide-react";

interface RiskRulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskRulesDrawer: React.FC<RiskRulesDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 p-6 overflow-y-auto h-full shadow-2xl flex flex-col justify-between text-slate-900">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 font-serif">Risk Rules & Load Logic</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Condition Thresholds Table */}
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Base Condition Thresholds
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Condition</th>
                    <th className="py-2 px-3 text-emerald-700 font-bold">Low (1)</th>
                    <th className="py-2 px-3 text-amber-700 font-bold">Moderate (2)</th>
                    <th className="py-2 px-3 text-orange-700 font-bold">High (3)</th>
                    <th className="py-2 px-3 text-red-700 font-bold">Severe (4)</th>
                    <th className="py-2 px-3 text-slate-900 font-bold">No Travel (5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  <tr>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-600" /> Wind
                    </td>
                    <td className="py-2 px-3">&lt; 25 mph</td>
                    <td className="py-2 px-3">25–34</td>
                    <td className="py-2 px-3">35–44</td>
                    <td className="py-2 px-3">45–54</td>
                    <td className="py-2 px-3 font-bold text-red-600">≥ 55 mph</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900 flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-blue-600" /> Rain
                    </td>
                    <td className="py-2 px-3">&lt; 0.10 in/h</td>
                    <td className="py-2 px-3">0.10–0.25</td>
                    <td className="py-2 px-3">0.25–0.50</td>
                    <td className="py-2 px-3">0.50–1.00</td>
                    <td className="py-2 px-3 font-bold text-red-600">&gt; 1.00 in/h</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900 flex items-center gap-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-indigo-600" /> Snow
                    </td>
                    <td className="py-2 px-3">&lt; 0.5 in/h</td>
                    <td className="py-2 px-3">0.5–1.0</td>
                    <td className="py-2 px-3">1.0–2.0</td>
                    <td className="py-2 px-3">2.0–3.0</td>
                    <td className="py-2 px-3 font-bold text-red-600">&gt; 3.0 in/h</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Specific Load Overrides */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>2. Commercial Load Weight Overrides</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-bold text-red-800 flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    Wind ≥ 55 mph → No Travel
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Triggers mandatory No Travel for any vehicle load weight configuration.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="font-bold text-amber-800 flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    Wind 45–54 mph + Weight &gt; 30,000 lb → No Travel
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Elevates risk from Severe to No Travel when carrying loads over 30,000 lbs in 45–54 mph crosswinds.
                  </p>
                </div>

                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="font-bold text-orange-800 flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    Wind 35–44 mph + Weight &gt; 40,000 lb → Severe
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Elevates risk from High to Severe when hauling heavy cargo exceeding 40,000 lbs.
                  </p>
                </div>
              </div>
            </div>

            {/* Route Recommendation Ranking */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. Multi-Criteria Recommendation Priority</span>
              </h3>
              <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside bg-slate-50 p-3 rounded-lg border border-slate-200">
                <li className="font-semibold text-emerald-800">
                  Fewest Severe miles (primary hazard elimination)
                </li>
                <li className="font-semibold text-emerald-800">
                  Fewest High miles (secondary hazard mitigation)
                </li>
                <li className="text-slate-700">
                  Lowest average numerical risk score
                </li>
                <li className="text-slate-700">
                  Shortest travel time (dispatch efficiency)
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
          >
            Close Rules Guide
          </button>
        </div>
      </div>
    </div>
  );
};
