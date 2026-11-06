import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { RouteOption, Checkpoint, CorridorData } from "../types";
import { Wind, CloudRain, Snowflake, Clock, AlertTriangle } from "lucide-react";

interface MapViewProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  onSelectCheckpoint: (cp: Checkpoint, routeName: string) => void;
  corridorData?: CorridorData;
  showHeatmap: boolean;
  selectedCheckpoint?: Checkpoint | null;
}

// Helper to auto-fit map viewport to active routes or corridor bounds
const MapBoundsAdjuster: React.FC<{ routes: RouteOption[] }> = ({ routes }) => {
  const map = useMap();

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    const allPoints: [number, number][] = [];
    routes.forEach((r) => {
      r.coordinates.forEach(([lon, lat]) => {
        allPoints.push([lat, lon]);
      });
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [routes, map]);

  return null;
};

// Route styling palette
const ROUTE_STYLES: Record<
  number,
  { defaultColor: string; selectedColor: string; dashArray?: string; weight: number }
> = {
  1: { defaultColor: "#10b981", selectedColor: "#059669", weight: 6 }, // Emerald for recommended
  2: { defaultColor: "#3b82f6", selectedColor: "#2563eb", weight: 4, dashArray: "4, 6" }, // Blue
  3: { defaultColor: "#8b5cf6", selectedColor: "#7c3aed", weight: 4, dashArray: "2, 6" }, // Purple
};

export const MapView: React.FC<MapViewProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onSelectCheckpoint,
  corridorData,
  showHeatmap,
  selectedCheckpoint,
}) => {
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of US
        zoom={5}
        className="w-full h-full"
        zoomControl={true}
      >
        <MapBoundsAdjuster routes={routes} />

        {/* High performance dark matter map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* 1. Corridor Weather Heatmap Layer */}
        {showHeatmap && corridorData && corridorData.points && (
          <>
            {corridorData.points.map((pt, idx) => {
              // Color gradient according to intensity
              let fillColor = "#22c55e"; // low
              if (pt.intensity > 0.7) fillColor = "#ef4444"; // severe / no travel
              else if (pt.intensity > 0.5) fillColor = "#f97316"; // high
              else if (pt.intensity > 0.3) fillColor = "#eab308"; // moderate

              return (
                <CircleMarker
                  key={`corridor-pt-${idx}`}
                  center={[pt.lat, pt.lon]}
                  radius={18}
                  pathOptions={{
                    fillColor: fillColor,
                    fillOpacity: pt.intensity * 0.45,
                    stroke: false,
                  }}
                >
                  <Tooltip direction="top" opacity={0.9}>
                    <div className="text-[10px] font-sans">
                      <div className="font-bold">{pt.risk_level} Risk Front</div>
                      <div>Wind: {pt.wind_mph} mph</div>
                      <div>Precip: {pt.rain_in_per_hr} in/hr</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </>
        )}

        {/* 2. Route Polylines */}
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const styleConfig = ROUTE_STYLES[route.rank] || {
            defaultColor: "#64748b",
            selectedColor: "#94a3b8",
            weight: 3,
          };

          const latLngs: [number, number][] = route.coordinates.map(
            ([lon, lat]) => [lat, lon]
          );

          return (
            <React.Fragment key={route.id}>
              {/* Outer glow line if selected or recommended */}
              {isSelected && (
                <Polyline
                  positions={latLngs}
                  pathOptions={{
                    color: route.is_recommended ? "#34d399" : "#60a5fa",
                    weight: styleConfig.weight + 6,
                    opacity: 0.35,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              )}

              {/* Core Route Line */}
              <Polyline
                positions={latLngs}
                eventHandlers={{
                  click: () => onSelectRoute(route.id),
                }}
                pathOptions={{
                  color: isSelected
                    ? styleConfig.selectedColor
                    : styleConfig.defaultColor,
                  weight: isSelected ? styleConfig.weight : styleConfig.weight - 1,
                  opacity: isSelected ? 0.95 : 0.45,
                  dashArray: isSelected ? undefined : styleConfig.dashArray,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              >
                <Tooltip sticky direction="top" opacity={0.9}>
                  <div className="text-xs font-sans">
                    <span className="font-bold">
                      Route #{route.rank}: {route.name}
                    </span>
                    {route.is_recommended && (
                      <span className="ml-1.5 text-emerald-400 font-semibold">
                        ★ Recommended
                      </span>
                    )}
                    <div>
                      {route.distance_miles} mi • Avg Risk:{" "}
                      {route.summary.average_risk.toFixed(1)}/5
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* 3. Checkpoints for Selected Route */}
        {selectedRoute &&
          selectedRoute.checkpoints.map((cp) => {
            const isTargeted =
              selectedCheckpoint && selectedCheckpoint.index === cp.index;

            return (
              <CircleMarker
                key={`cp-${selectedRoute.id}-${cp.index}`}
                center={[cp.lat, cp.lon]}
                radius={isTargeted ? 8 : 6}
                eventHandlers={{
                  click: () => onSelectCheckpoint(cp, selectedRoute.name),
                }}
                pathOptions={{
                  fillColor: cp.color,
                  fillOpacity: 1.0,
                  color: isTargeted ? "#ffffff" : "#0f172a",
                  weight: isTargeted ? 2.5 : 1.5,
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[210px] text-slate-100 font-sans">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700">
                      <span className="font-bold text-xs">
                        Mile {cp.mile_marker} Checkpoint
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{
                          backgroundColor: `${cp.color}25`,
                          color: cp.color,
                          border: `1px solid ${cp.color}60`,
                        }}
                      >
                        {cp.final_level}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1 text-slate-300">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>ETA: {cp.eta_formatted}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[10px]">
                        <div className="flex items-center gap-1">
                          <Wind className="w-3 h-3 text-cyan-400" />
                          <span>{cp.weather.wind_mph} mph</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CloudRain className="w-3 h-3 text-blue-400" />
                          <span>{cp.weather.rain_in_per_hr} in/h</span>
                        </div>
                      </div>

                      {cp.weather.snow_in_per_hr > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-300">
                          <Snowflake className="w-3 h-3" />
                          <span>Snow: {cp.weather.snow_in_per_hr} in/hr</span>
                        </div>
                      )}

                      {cp.active_overrides && cp.active_overrides.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-slate-700/60 text-[10px] text-amber-300 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>Load Override Active</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectCheckpoint(cp, selectedRoute.name)}
                        className="w-full mt-2 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition"
                      >
                        Inspect Full Telemetry
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-2 pointer-events-auto max-w-xs">
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Checkpoint Risk Legend
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span>
            <span className="text-slate-300">Low (1)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
            <span className="text-slate-300">Moderate (2)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span className="text-slate-300">High (3)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-300">Severe (4)</span>
          </div>
          <div className="flex items-center space-x-1.5 col-span-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e1e24] border border-red-500"></span>
            <span className="text-red-400 font-bold">No Travel (5)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

