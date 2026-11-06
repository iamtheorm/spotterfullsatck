import React from "react";
import { RouteOption } from "../types";
import { Check, ShieldCheck, AlertCircle } from "lucide-react";

interface RouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  if (!routes || routes.length === 0) return null;

  const topRoute = routes.find((r) => r.is_recommended) || routes[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Alternative Routes Decision Matrix</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ranked strictly by: Fewest Severe Miles → Fewest High Miles → Lowest Avg Risk → Travel Time
          </p>
        </div>
      </div>

      {/* Decision Summary Banner */}
      <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-xs flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-emerald-300">
            Recommendation: {topRoute.name} (Rank #1)
          </div>
          <p className="text-slate-300 mt-0.5">
            Minimizes critical weather hazard exposure with{" "}
            <strong>{topRoute.summary.severe_miles} mi</strong> in Severe conditions and{" "}
            <strong>{topRoute.summary.high_miles} mi</strong> in High conditions, achieving an average risk of{" "}
            <strong>{topRoute.summary.average_risk.toFixed(1)}/5</strong> across its{" "}
            <strong>{topRoute.distance_miles} miles</strong>.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
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
          <tbody className="divide-y divide-slate-800">
            {routes.map((r) => {
              const isSelected = r.id === selectedRouteId;
              const hours = Math.floor(r.duration_hours);
              const mins = Math.round((r.duration_hours - hours) * 60);

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRoute(r.id)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? "bg-slate-800/90 font-medium text-white"
                      : "text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          r.is_recommended
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        #{r.rank}
                      </span>
                      <span className="font-semibold text-white">{r.name}</span>
                      {r.is_recommended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Best
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-red-400">
                    {r.summary.severe_miles} mi
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-amber-400">
                    {r.summary.high_miles} mi
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        r.summary.average_risk > 3
                          ? "bg-red-950/60 text-red-300"
                          : r.summary.average_risk > 2
                          ? "bg-amber-950/60 text-amber-300"
                          : "bg-emerald-950/60 text-emerald-300"
                      }`}
                    >
                      {r.summary.average_risk.toFixed(1)} / 5
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    {hours}h {mins}m
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-400">
                    {r.distance_miles} mi
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRoute(r.id);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

