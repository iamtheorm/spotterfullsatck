import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
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
  AlertTriangle,
  Map,
  Layers,
  CloudSun,
  ChevronDown,
  Crosshair,
} from "lucide-react";

interface MapViewProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  onSelectCheckpoint?: (cp: Checkpoint) => void;
  onOpenModal: (cp: Checkpoint, routeName: string) => void;
  onOpenRules?: () => void;
  corridorData?: CorridorData;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  forecastHour: number;
  onHourChange: React.Dispatch<React.SetStateAction<number>> | ((hour: number) => void);
  isLoadingCorridor?: boolean;
  selectedCheckpoint?: Checkpoint | null;
}

// Custom DivIcon for Origin and Destination Pins matching screenshot
const createNamedMarkerIcon = (label: string, isOrigin: boolean) => {
  return L.divIcon({
    className: "custom-named-marker",
    html: `
      <div style="display: flex; align-items: center; gap: 6px; background: white; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid ${
        isOrigin ? "#10b981" : "#ef4444"
      }; font-weight: 700; font-size: 11px; color: #0f172a; white-space: nowrap;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${
          isOrigin ? "#10b981" : "#ef4444"
        }; display: inline-block;"></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [100, 30],
    iconAnchor: [50, 15],
  });
};

// Smoothly pans and fits the map to the currently selected route
const MapBoundsAdjuster: React.FC<{
  routes: RouteOption[];
  selectedRouteId: string;
  triggerCenter?: number;
}> = ({ routes, selectedRouteId, triggerCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    const targetRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
    const points: [number, number][] = targetRoute.coordinates.map(([lon, lat]) => [lat, lon]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
    }
  }, [selectedRouteId, routes, map, triggerCenter]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onSelectCheckpoint,
  onOpenModal,
  onOpenRules,
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
  const [recenterCount, setRecenterCount] = useState(0);
  const [isWeatherDropdownOpen, setIsWeatherDropdownOpen] = useState(false);

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

  // Extract start and end city labels
  const startCoords = selectedRoute?.coordinates?.[0];
  const endCoords = selectedRoute?.coordinates?.[selectedRoute.coordinates.length - 1];

  const hasSevereWeather = selectedRoute?.summary?.severe_miles > 0 || selectedRoute?.summary?.has_no_travel;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 isolate z-0 flex flex-col shadow-sm">
      {/* 1. TOP FLOATING HUD BAR matching screenshot */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none">
        {/* Left Side: Map View (active navy) | Risk Overlay | Weather Layer */}
        <div className="flex items-center space-x-2 pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-sm">
          {/* Map View Pill */}
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Map className="w-3.5 h-3.5 text-sky-400" />
            <span>Map View</span>
          </button>

          {/* Risk Overlay Pill */}
          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              showHeatmap
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Risk Overlay</span>
          </button>

          {/* Weather Layer Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsWeatherDropdownOpen(!isWeatherDropdownOpen)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-500" />
              <span>Weather Layer</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isWeatherDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsSatellite(false);
                    setIsWeatherDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium ${
                    !isSatellite ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Positron Light Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSatellite(true);
                    setIsWeatherDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium ${
                    isSatellite ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Satellite Imagery
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Risk Legend matching screenshot */}
        <div className="hidden sm:flex items-center space-x-3 pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-sm text-xs font-medium text-slate-700">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-semibold text-slate-600">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-[11px] font-semibold text-slate-600">Mod</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-[11px] font-semibold text-slate-600">High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-[11px] font-semibold text-slate-600">Severe</span>
          </div>
        </div>
      </div>

      {/* Recenter Crosshair Button on Top-Left below Leaflet Zoom */}
      <div className="absolute top-28 left-3 z-[400] pointer-events-auto">
        <button
          type="button"
          onClick={() => setRecenterCount((c) => c + 1)}
          title="Center on Route"
          className="w-8 h-8 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 transition"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* 2. FLOATING BOTTOM-LEFT WEATHER ALERT CARD matching screenshot */}
      <div className="absolute bottom-20 left-4 z-[400] pointer-events-auto max-w-sm">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-lg flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Weather Alert</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {hasSevereWeather
                ? "Severe weather or high winds along your route"
                : "Active corridor weather monitoring enabled"}
            </p>
          </div>
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap ml-1"
            >
              View Details →
            </button>
          )}
        </div>
      </div>

      {/* 3. LEAFLET MAP CANVAS */}
      <div className="w-full h-full">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          scrollWheelZoom={true}
          className="w-full h-full"
          zoomControl={true}
        >
          <MapBoundsAdjuster
            routes={routes}
            selectedRouteId={selectedRouteId}
            triggerCenter={recenterCount}
          />

          {/* Positron Clean Desaturated Light Map Tiles */}
          {!isSatellite ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles-positron"
            />
          ) : (
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              className="map-tiles-satellite"
            />
          )}

          {/* 4. WEATHER CORRIDOR HEATMAP LAYER */}
          {showHeatmap && corridorData && corridorData.points && (
            <>
              {corridorData.points.map((pt, idx) => {
                const color =
                  pt.risk_level === "No Travel"
                    ? "#991b1b"
                    : pt.risk_level === "Severe"
                    ? "#ef4444"
                    : pt.risk_level === "High"
                    ? "#f97316"
                    : pt.risk_level === "Moderate"
                    ? "#facc15"
                    : "#10b981";

                return (
                  <CircleMarker
                    key={`corridor-pt-${idx}`}
                    center={[pt.lat, pt.lon]}
                    radius={14}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.22,
                      weight: 0,
                    }}
                  />
                );
              })}
            </>
          )}

          {/* 5. INACTIVE ALTERNATIVE ROUTES: Subtle Faded Lines */}
          {routes
            .filter((r) => r.id !== selectedRouteId)
            .map((r) => {
              const coords: [number, number][] = r.coordinates.map(([lon, lat]) => [lat, lon]);
              return (
                <Polyline
                  key={`inactive-${r.id}`}
                  positions={coords}
                  pathOptions={{
                    color: "#94a3b8",
                    weight: 3,
                    opacity: 0.45,
                    dashArray: "6, 8",
                  }}
                  eventHandlers={{
                    click: () => onSelectRoute(r.id),
                  }}
                />
              );
            })}

          {/* 6. ACTIVE ROUTE POLYLINE: Glowing Emerald / Navy Focus Path */}
          {selectedRoute && (
            <>
              {/* Outer Glow Halo */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: selectedRoute.is_recommended ? "#10b981" : "#3b82f6",
                  weight: 8,
                  opacity: 0.28,
                }}
              />
              {/* Solid High-Visibility Path */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: selectedRoute.is_recommended ? "#059669" : "#2563eb",
                  weight: 4.5,
                  opacity: 0.95,
                  dashArray: "2, 4",
                }}
              />
            </>
          )}

          {/* 7. ORIGIN & DESTINATION LABELED MARKERS */}
          {startCoords && (
            <Marker
              position={[startCoords[1], startCoords[0]]}
              icon={createNamedMarkerIcon("Origin", true)}
            />
          )}
          {endCoords && (
            <Marker
              position={[endCoords[1], endCoords[0]]}
              icon={createNamedMarkerIcon("Destination", false)}
            />
          )}

          {/* 8. CHECKPOINT DOTS: Single Focused Chain on Active Route Only */}
          {selectedRoute &&
            selectedRoute.checkpoints &&
            selectedRoute.checkpoints.map((cp) => {
              const isSelected = selectedCheckpoint?.index === cp.index;
              const color =
                cp.final_level === "No Travel"
                  ? "#991b1b"
                  : cp.final_level === "Severe"
                  ? "#ef4444"
                  : cp.final_level === "High"
                  ? "#f97316"
                  : cp.final_level === "Moderate"
                  ? "#facc15"
                  : "#10b981";

              return (
                <CircleMarker
                  key={`active-cp-${cp.index}`}
                  center={[cp.lat, cp.lon]}
                  radius={isSelected ? 7 : 5}
                  pathOptions={{
                    color: isSelected ? "#0f172a" : "#ffffff",
                    fillColor: color,
                    fillOpacity: 1.0,
                    weight: isSelected ? 3 : 1.8,
                  }}
                  eventHandlers={{
                    click: () => onOpenModal(cp, selectedRoute.name),
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -8]}
                    opacity={0.96}
                    className="checkpoint-hover-tooltip"
                  >
                    <div className="font-mono text-center">
                      <div className="font-bold text-sky-400">
                        CP #{cp.index} &bull; Mile {cp.mile_marker}
                      </div>
                      <div className="text-[10px] text-slate-200 mt-0.5">
                        ETA: {cp.eta_formatted}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        Wind: {cp.weather?.wind_mph} mph | Rain: {cp.weather?.rain_in_per_hr} in/h
                      </div>
                      <div className="mt-1 font-bold text-amber-300">
                        Risk: {cp.final_level}
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>

      {/* 9. BOTTOM SCRUBBER OVERLAY: 0–48 Hour Evolution Timeline */}
      <div className="absolute bottom-3 left-4 right-4 z-[400] flex justify-center pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-2 shadow-lg flex items-center space-x-3 pointer-events-auto max-w-xl w-full">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
            title={isPlaying ? "Pause" : "Play Timeline"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              if (typeof onHourChange === "function") {
                (onHourChange as React.Dispatch<React.SetStateAction<number>>)(0);
              }
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Reset to Departure"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 flex flex-col space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-500" />
                Corridor Forecast Evolution:
              </span>
              <span className="font-mono text-blue-600">+{forecastHour}h Offset</span>
            </div>
            <input
              type="range"
              min="0"
              max="48"
              step="3"
              value={forecastHour}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (typeof onHourChange === "function") {
                  (onHourChange as React.Dispatch<React.SetStateAction<number>>)(val);
                }
              }}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
