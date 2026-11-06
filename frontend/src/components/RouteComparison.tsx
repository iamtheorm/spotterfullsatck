import React from "react";
import { RouteOption } from "../types";
import { Check, ShieldCheck, X } from "lucide-react";

interface RouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !routes || routes.length === 0) return null;

  const topRoute = routes.find((r) => r.is_recommended) || routes[0];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-5 shadow-2xl relative text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Alternative Routes Decision Matrix</span>
            </h2>
            <p className="text-xs text-slate-400">
              Ranked strictly by: Fewest Severe Miles → Fewest High Miles → Lowest Avg Risk → Travel Time
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Decision Summary */}
        <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-slate-200">
            <strong>{topRoute.name}</strong> is recommended with only <strong>{topRoute.summary.severe_miles} mi</strong> Severe and <strong>{topRoute.summary.high_miles} mi</strong> High weather exposure.
          </span>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Route Option</th>
                <th className="py-2.5 px-3 text-red-400">Severe Miles</th>
                <th className="py-2.5 px-3 text-amber-400">High Miles</th>
                <th className="py-2.5 px-3">Avg Risk</th>
                <th className="py-2.5 px-3">Travel Time</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {routes.map((r) => {
                const isSelected = r.id === selectedRouteId;
                const hours = Math.floor(r.duration_hours);
                const mins = Math.round((r.duration_hours - hours) * 60);

                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      onSelectRoute(r.id);
                      onClose();
                    }}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? "bg-slate-800 font-medium text-white"
                        : "text-slate-300 hover:bg-slate-850"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            r.is_recommended
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          #{r.rank}
                        </span>
                        <span className="font-semibold text-white">{r.name}</span>
                        {r.is_recommended && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-red-400">
                      {r.summary.severe_miles} mi
                    </td>

                    <td className="py-2.5 px-3 font-bold text-amber-400">
                      {r.summary.high_miles} mi
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          r.summary.average_risk > 3
                            ? "text-red-400"
                            : r.summary.average_risk > 2
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {r.summary.average_risk.toFixed(1)} / 5
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      {hours}h {mins}m
                    </td>

                    <td className="py-2.5 px-3 text-slate-400">
                      {r.distance_miles} mi
                    </td>

                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRoute(r.id);
                          onClose();
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {isSelected ? "Active" : "Select"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
