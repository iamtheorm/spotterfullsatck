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
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 isolate z-0 flex flex-col shadow-xs">
      {/* Top Floating Bar: Quick Route Switcher Tabs */}
      {routes && routes.length > 0 && (
        <div className="absolute top-3 left-14 z-[400] flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 shadow-md pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-2 tracking-wider hidden sm:inline">
            Route:
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
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>#{r.rank}</span>
                <span className="font-normal truncate max-w-[120px]">
                  {r.name.replace(" Corridor", "").replace(" Route", "")}
                </span>
                {r.is_recommended && (
                  <span className="text-[10px] font-bold px-1 rounded bg-emerald-500/30 text-white">
                    REC
                  </span>
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

          {/* Desaturated clean map tiles for maximum legibility */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            className="map-tiles-clean"
          />

          {/* 1. Weather Corridor Heatmap Layer */}
          {showHeatmap && corridorData && corridorData.points && (
            <>
              {corridorData.points.map((pt, idx) => {
                let fillColor = "#22c55e"; // Low
                if (pt.intensity > 0.7) fillColor = "#dc2626"; // Severe / No Travel
                else if (pt.intensity > 0.5) fillColor = "#ea580c"; // High
                else if (pt.intensity > 0.3) fillColor = "#ca8a04"; // Moderate

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
                    <Tooltip direction="top" opacity={0.95}>
                      <div className="text-[11px] font-sans">
                        <div className="font-bold text-slate-900">{pt.risk_level} Hazard Zone</div>
                        <div className="text-slate-600">Wind: {pt.wind_mph} mph</div>
                        <div className="text-slate-600">Precip: {pt.rain_in_per_hr} in/hr</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </>
          )}

          {/* 2. Inactive Alternate Routes: Subdued Grey Dashed Tracks */}
          {routes
            .filter((r) => r.id !== selectedRouteId)
            .map((route) => {
              const latLngs: [number, number][] = route.coordinates.map(([lon, lat]) => [lat, lon]);

              return (
                <Polyline
                  key={`inactive-${route.id}`}
                  positions={latLngs}
                  eventHandlers={{
                    click: () => onSelectRoute(route.id),
                  }}
                  pathOptions={{
                    color: "#94a3b8",
                    weight: 3,
                    opacity: 0.6,
                    dashArray: "4, 6",
                    lineCap: "round",
                  }}
                >
                  <Tooltip sticky direction="top" opacity={0.95}>
                    <div className="text-xs font-sans">
                      <span className="font-semibold text-slate-800">#{route.rank}: {route.name}</span>
                      <div className="text-[11px] text-slate-500">{route.distance_miles} mi • Click to activate</div>
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

          {/* 3. Active Selected Route: High-Contrast Bold with Outer Glow */}
          {selectedRoute && (
            <>
              {/* Outer soft glow */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: selectedRoute.is_recommended ? "#4ade80" : "#60a5fa",
                  weight: 10,
                  opacity: 0.35,
                  lineCap: "round",
                }}
              />
              {/* Inner crisp line */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: selectedRoute.is_recommended ? "#16a34a" : "#2563eb",
                  weight: 5,
                  opacity: 1.0,
                  lineCap: "round",
                }}
              />
            </>
          )}

          {/* 4. Checkpoints: ONLY rendered on the active route to eliminate visual clutter */}
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
                    color: isTargeted ? "#0f172a" : "#ffffff",
                    weight: isTargeted ? 2.5 : 1.5,
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[210px] text-slate-900 font-sans text-xs">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                        <span className="font-bold text-slate-800">
                          Mile {cp.mile_marker} Checkpoint
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                          style={{
                            backgroundColor: `${cp.color}15`,
                            color: cp.color === "#1e1e24" ? "#dc2626" : cp.color,
                            border: `1px solid ${cp.color}40`,
                          }}
                        >
                          {cp.final_level}
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-600 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>ETA: {cp.eta_formatted}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[11px] text-slate-700">
                          <div className="flex items-center gap-1">
                            <Wind className="w-3 h-3 text-cyan-600" />
                            <span>{cp.weather.wind_mph} mph</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CloudRain className="w-3 h-3 text-blue-600" />
                            <span>{cp.weather.rain_in_per_hr} in/h</span>
                          </div>
                        </div>

                        {cp.weather.snow_in_per_hr > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-600">
                            <Snowflake className="w-3 h-3" />
                            <span>Snow: {cp.weather.snow_in_per_hr} in/h</span>
                          </div>
                        )}

                        {cp.active_overrides && cp.active_overrides.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-amber-700 flex items-start gap-1 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>Load Override Triggered</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenModal(cp, selectedRoute.name)}
                          className="w-full mt-2 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shadow-xs"
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

      {/* Floating Bottom-Left Risk Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-lg text-xs space-y-1.5 pointer-events-auto shadow-md">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Risk Classification
        </div>
        <div className="flex items-center space-x-2.5 font-mono text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]"></span>
            <span className="text-slate-700">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
            <span className="text-slate-700">Mod</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span className="text-slate-700">High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-700">Severe</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e1e24] border border-red-500"></span>
            <span className="text-red-600 font-bold">No Travel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
