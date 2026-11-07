import React from "react";
import { RouteOption, DistanceUnit } from "../types";
import { Check, ShieldCheck, X } from "lucide-react";

interface RouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  distanceUnit?: DistanceUnit;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isOpen,
  onClose,
  distanceUnit = "mi",
}) => {
  if (!isOpen || !routes || routes.length === 0) return null;

  const topRoute = routes.find((r) => r.is_recommended) || routes[0];

  const formatDist = (m: number) => {
    if (distanceUnit === "km") {
      return `${(m * 1.60934).toFixed(1)} km`;
    }
    return `${m} mi`;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-5 shadow-2xl relative text-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Alternative Routes Decision Matrix</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ranked strictly by: Fewest Severe Distance → Fewest High Distance → Lowest Avg Risk → Travel Time
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Decision Summary */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-slate-800">
            <strong>{topRoute.name}</strong> is recommended with only <strong>{formatDist(topRoute.summary.severe_miles)}</strong> Severe and <strong>{formatDist(topRoute.summary.high_miles)}</strong> High weather exposure.
          </span>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Route Option</th>
                <th className="py-2.5 px-3 text-red-600">Severe ({distanceUnit})</th>
                <th className="py-2.5 px-3 text-amber-600">High ({distanceUnit})</th>
                <th className="py-2.5 px-3">Avg Risk</th>
                <th className="py-2.5 px-3">Travel Time</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
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
                        ? "bg-blue-50/70 font-semibold text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                            r.is_recommended
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          #{r.rank}
                        </span>
                        <span className="font-bold text-slate-900">{r.name}</span>
                        {r.is_recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-red-600">
                      {formatDist(r.summary.severe_miles)}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-amber-600">
                      {formatDist(r.summary.high_miles)}
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          r.summary.average_risk > 3
                            ? "bg-red-100 text-red-700"
                            : r.summary.average_risk > 2
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {r.summary.average_risk.toFixed(1)} / 5
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      {hours}h {mins}m
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {formatDist(r.distance_miles)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRoute(r.id);
                          onClose();
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
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
