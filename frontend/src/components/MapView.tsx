import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { RouteOption, Checkpoint, CorridorData } from "../types";
import {
  Wind,
  CloudRain,
  Snowflake,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Layers,
  ShieldCheck,
  Eye,
} from "lucide-react";

interface MapViewProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  onSelectCheckpoint?: (cp: Checkpoint) => void;
  onOpenModal: (cp: Checkpoint, routeName: string) => void;
  corridorData?: CorridorData;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  forecastHour: number;
  onHourChange: React.Dispatch<React.SetStateAction<number>> | ((hour: number) => void);
  isLoadingCorridor?: boolean;
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
      map.fitBounds(bounds, { padding: [55, 55], maxZoom: 10 });
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
  onToggleHeatmap,
  forecastHour,
  onHourChange,
  isLoadingCorridor,
  selectedCheckpoint,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  // Timeline auto-play
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        if (typeof onHourChange === "function") {
          (onHourChange as React.Dispatch<React.SetStateAction<number>>)((prev: number) => {
            if (prev >= 48) {
              setIsPlaying(false);
              return 48;
            }
            return prev + 3;
          });
        }
      }, 1100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, onHourChange]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 isolate z-0 flex flex-col shadow-sm">
      {/* 1. TOP-LEFT HUD: Active Route Selection Tabs */}
      {routes && routes.length > 0 && (
        <div className="absolute top-3 left-14 z-[400] flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md pointer-events-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2 tracking-wider hidden sm:inline">
            Focus Path:
          </span>
          {routes.map((r) => {
            const isSelected = r.id === selectedRouteId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRoute(r.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? r.is_recommended
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>#{r.rank}</span>
                <span className="font-medium truncate max-w-[110px]">
                  {r.name.replace(" Corridor", "").replace(" Route", "")}
                </span>
                {r.is_recommended && (
                  <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-emerald-500/30 text-white">
                    BEST
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. TOP-RIGHT HUD: Map Layer & Controls */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md pointer-events-auto text-xs">
        <button
          type="button"
          onClick={onToggleHeatmap}
          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
            showHeatmap
              ? "bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>{showHeatmap ? "Heatmap Active" : "Heatmap"}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSatellite(!isSatellite)}
          className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
            isSatellite
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isSatellite ? "Satellite" : "Positron"}</span>
        </button>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="w-full h-full flex-1">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={5}
          className="w-full h-full"
          zoomControl={true}
        >
          <MapBoundsAdjuster routes={routes} selectedRouteId={selectedRouteId} />

          {/* Clean Positron (Desaturated Gray-Blue) vs Satellite Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={
              isSatellite
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            maxZoom={19}
            className={isSatellite ? "map-tiles-satellite" : "map-tiles-positron"}
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

          {/* 2. Inactive Alternate Routes: Faded, Semi-Transparent Thin Grey-Blue Tracks */}
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
                    color: "#64748b",
                    weight: 2.5,
                    opacity: 0.45,
                    dashArray: "3, 6",
                    lineCap: "round",
                  }}
                >
                  <Tooltip sticky direction="top" opacity={0.95}>
                    <div className="text-xs font-sans">
                      <span className="font-semibold text-slate-800">#{route.rank}: {route.name}</span>
                      <div className="text-[10px] text-slate-500">{route.distance_miles} mi • Click to focus</div>
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

          {/* 3. Selected/Recommended Focus Route: Thick 4px Solid Path with Vibrant Outer Glow */}
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
              {/* Inner solid 4px path */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: selectedRoute.is_recommended ? "#16a34a" : "#2563eb",
                  weight: 4.5,
                  opacity: 1.0,
                  lineCap: "round",
                }}
              />
            </>
          )}

          {/* 4. Checkpoints: ONLY OVERLAID ON TOP OF THE SINGLE FOCUS PATH */}
          {selectedRoute &&
            selectedRoute.checkpoints.map((cp) => {
              const isTargeted = selectedCheckpoint && selectedCheckpoint.index === cp.index;

              return (
                <CircleMarker
                  key={`cp-${selectedRoute.id}-${cp.index}`}
                  center={[cp.lat, cp.lon]}
                  radius={isTargeted ? 7.5 : 5.5}
                  eventHandlers={{
                    click: () => {
                      onOpenModal(cp, selectedRoute.name);
                    },
                  }}
                  pathOptions={{
                    fillColor: cp.color,
                    fillOpacity: 1.0,
                    color: isTargeted ? "#0f172a" : "#ffffff",
                    weight: isTargeted ? 2.5 : 1.5,
                  }}
                >
                  {/* Instant Hover Popover HUD */}
                  <Tooltip
                    direction="top"
                    offset={[0, -6]}
                    opacity={1}
                    className="checkpoint-hover-tooltip"
                  >
                    <div className="space-y-0.5 min-w-[190px]">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-1">
                        <span className="font-bold text-white">
                          CP #{cp.index + 1} • Mile {cp.mile_marker}
                        </span>
                        <span
                          className="text-[9px] font-extrabold uppercase px-1 rounded"
                          style={{ backgroundColor: cp.color, color: "#ffffff" }}
                        >
                          {cp.final_level}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 pt-0.5">
                        ETA: <strong className="text-white">{cp.eta_formatted}</strong>
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        Wind: {cp.weather.wind_mph}mph • Rain: {cp.weather.rain_in_per_hr} in/h
                      </div>
                      {cp.active_overrides && cp.active_overrides.length > 0 && (
                        <div className="text-[9px] text-amber-300 font-bold">
                          ⚡ Load Rule Override Active
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 italic pt-0.5">
                        Click for full telemetry modal
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>

      {/* 3. BOTTOM-CENTER HUD: Sleek Floating Timeline Scrubber */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-xl bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xl pointer-events-auto flex items-center justify-between gap-3 text-xs">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause timeline" : "Play forecast progression"}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex-shrink-0 shadow-2xs"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              (onHourChange as any)(0);
            }}
            title="Reset to departure time"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex-shrink-0 border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="font-mono font-extrabold text-slate-900 min-w-[50px] text-xs">
            +{forecastHour}h
          </div>
        </div>

        {/* Compact Scrubber with Weather Indicators */}
        <div className="flex-1 relative flex items-center mx-1">
          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={forecastHour}
            onChange={(e) => {
              setIsPlaying(false);
              (onHourChange as any)(parseInt(e.target.value, 10));
            }}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Forecast Timestamp Info */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-600">
          <span className="hidden sm:inline">
            {corridorData?.valid_time_formatted || "Departure"}
          </span>
          {isLoadingCorridor && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          )}
        </div>
      </div>

      {/* 4. BOTTOM-LEFT HUD: Minimalist Risk Legend */}
      <div className="absolute bottom-4 left-3 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 p-2 rounded-xl text-xs space-y-1 pointer-events-auto shadow-md hidden md:block">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          Risk Key
        </div>
        <div className="flex items-center space-x-2 font-mono text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
            <span className="text-slate-600">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
            <span className="text-slate-600">Mod</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
            <span className="text-slate-600">High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-600">Severe</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#1e1e24] border border-red-500"></span>
            <span className="text-red-600 font-bold">No Travel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
