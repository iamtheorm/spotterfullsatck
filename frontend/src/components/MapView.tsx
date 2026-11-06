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
import { Wind, CloudRain, Snowflake, Clock, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";

interface MapViewProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  onSelectCheckpoint?: (cp: Checkpoint) => void;
  onOpenModal: (cp: Checkpoint, routeName: string) => void;
  corridorData?: CorridorData;
  showHeatmap: boolean;
  selectedCheckpoint?: Checkpoint | null;
}

// Smoothly pans and fits the map to the currently selected route
const MapBoundsAdjuster: React.FC<{ routes: RouteOption[]; selectedRouteId: string }> = ({
  routes,
  selectedRouteId,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    const targetRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
    const points: [number, number][] = targetRoute.coordinates.map(([lon, lat]) => [lat, lon]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [selectedRouteId, routes, map]);

  return null;
};

// Route color styling: Selected route is vibrant and bold, inactive routes are clean muted guides
const ROUTE_PALETTE: Record<number, { activeColor: string; inactiveColor: string }> = {
  1: { activeColor: "#10b981", inactiveColor: "#059669" }, // Emerald (Recommended)
  2: { activeColor: "#3b82f6", inactiveColor: "#2563eb" }, // Blue
  3: { activeColor: "#a855f7", inactiveColor: "#9333ea" }, // Purple
};

export const MapView: React.FC<MapViewProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onSelectCheckpoint,
  onOpenModal,
  corridorData,
  showHeatmap,
  selectedCheckpoint,
}) => {
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 isolate z-0 flex flex-col">
      {/* Top Floating Bar: Quick Route Switcher Tabs */}
      {routes && routes.length > 0 && (
        <div className="absolute top-3 left-14 z-[400] flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/80 shadow-lg pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-wider hidden sm:inline">
            Active Route:
          </span>
          {routes.map((r) => {
            const isSelected = r.id === selectedRouteId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRoute(r.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? r.is_recommended
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>#{r.rank}</span>
                <span className="font-normal truncate max-w-[120px]">{r.name.replace(" Corridor", "").replace(" Route", "")}</span>
                {r.is_recommended && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Map Viewport */}
      <div className="w-full h-full flex-1">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={5}
          className="w-full h-full"
          zoomControl={true}
        >
          <MapBoundsAdjuster routes={routes} selectedRouteId={selectedRouteId} />

          {/* OpenStreetMap Tile Layer with clean dark styling */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            className="map-tiles-dark"
          />

          {/* 1. Corridor Weather Heatmap Layer */}
          {showHeatmap && corridorData && corridorData.points && (
            <>
              {corridorData.points.map((pt, idx) => {
                let fillColor = "#22c55e";
                if (pt.intensity > 0.7) fillColor = "#ef4444";
                else if (pt.intensity > 0.5) fillColor = "#f97316";
                else if (pt.intensity > 0.3) fillColor = "#eab308";

                return (
                  <CircleMarker
                    key={`corridor-pt-${idx}`}
                    center={[pt.lat, pt.lon]}
                    radius={16}
                    pathOptions={{
                      fillColor: fillColor,
                      fillOpacity: pt.intensity * 0.35,
                      stroke: false,
                    }}
                  >
                    <Tooltip direction="top" opacity={0.9}>
                      <div className="text-[10px] font-sans">
                        <div className="font-bold">{pt.risk_level} Hazard Zone</div>
                        <div>Wind: {pt.wind_mph} mph</div>
                        <div>Precip: {pt.rain_in_per_hr} in/hr</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </>
          )}

          {/* 2. Route Polylines: Inactive routes rendered first, Active route rendered on top */}
          {routes
            .filter((r) => r.id !== selectedRouteId)
            .map((route) => {
              const style = ROUTE_PALETTE[route.rank] || { activeColor: "#64748b", inactiveColor: "#475569" };
              const latLngs: [number, number][] = route.coordinates.map(([lon, lat]) => [lat, lon]);

              return (
                <Polyline
                  key={`inactive-${route.id}`}
                  positions={latLngs}
                  eventHandlers={{
                    click: () => onSelectRoute(route.id),
                  }}
                  pathOptions={{
                    color: style.inactiveColor,
                    weight: 3,
                    opacity: 0.4,
                    dashArray: "4, 6",
                    lineCap: "round",
                  }}
                >
                  <Tooltip sticky direction="top" opacity={0.9}>
                    <div className="text-xs font-sans">
                      <span className="font-semibold text-slate-300">#{route.rank}: {route.name}</span>
                      <div className="text-[11px] text-slate-400">Click to activate route</div>
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

          {/* Active Route Polylines (Bold with Glow) */}
          {selectedRoute && (
            <>
              {/* Outer soft glow */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: selectedRoute.is_recommended ? "#34d399" : "#60a5fa",
                  weight: 10,
                  opacity: 0.3,
                  lineCap: "round",
                }}
              />
              {/* Inner core line */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: selectedRoute.is_recommended ? "#10b981" : "#3b82f6",
                  weight: 5,
                  opacity: 0.95,
                  lineCap: "round",
                }}
              />
            </>
          )}

          {/* 3. Checkpoints for Selected Route */}
          {selectedRoute &&
            selectedRoute.checkpoints.map((cp) => {
              const isTargeted = selectedCheckpoint && selectedCheckpoint.index === cp.index;

              return (
                <CircleMarker
                  key={`cp-${selectedRoute.id}-${cp.index}`}
                  center={[cp.lat, cp.lon]}
                  radius={isTargeted ? 7 : 5}
                  eventHandlers={{
                    click: () => {
                      if (onSelectCheckpoint) onSelectCheckpoint(cp);
                    },
                  }}
                  pathOptions={{
                    fillColor: cp.color,
                    fillOpacity: 1.0,
                    color: isTargeted ? "#ffffff" : "#0f172a",
                    weight: isTargeted ? 2 : 1.5,
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px] text-slate-100 font-sans text-xs">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700">
                        <span className="font-bold">Mile {cp.mile_marker}</span>
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

                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <div className="flex items-center gap-1.5">
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
                            <span>Load Override Triggered</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenModal(cp, selectedRoute.name)}
                          className="w-full mt-2 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition"
                        >
                          Inspect Full Telemetry & Rules
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>

      {/* Floating Bottom-Left Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-xs space-y-1.5 pointer-events-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Risk Classification
        </div>
        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
            <span className="text-slate-300">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
            <span className="text-slate-300">Mod</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
            <span className="text-slate-300">High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-300">Severe</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#1e1e24] border border-red-500"></span>
            <span className="text-red-400 font-bold">No Travel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
