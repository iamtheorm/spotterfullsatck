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
  AlertTriangle,
  Map as MapIcon,
  Layers,
  CloudSun,
  ChevronDown,
  Crosshair,
  Plus,
  Minus,
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
  originName?: string;
  destinationName?: string;
}

// Named Marker Pin Icon matching screenshot (e.g. green circle Chicago, red pin Dallas)
const createOriginMarker = (cityName: string) => {
  return L.divIcon({
    className: "custom-origin-marker",
    html: `
      <div style="display: flex; align-items: center; gap: 6px; background: white; padding: 5px 12px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.22); border: 2px solid #16a34a; font-weight: 800; font-size: 12px; color: #0f172a; white-space: nowrap;">
        <span style="width: 9px; height: 9px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
        <span>${cityName}</span>
      </div>
    `,
    iconSize: [95, 30],
    iconAnchor: [47, 15],
  });
};

const createDestinationMarker = (cityName: string) => {
  return L.divIcon({
    className: "custom-dest-marker",
    html: `
      <div style="display: flex; align-items: center; gap: 6px; background: white; padding: 5px 12px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.22); border: 2px solid #ef4444; font-weight: 800; font-size: 12px; color: #0f172a; white-space: nowrap;">
        <span style="width: 9px; height: 9px; border-radius: 50%; background: #ef4444; display: inline-block;"></span>
        <span>${cityName}</span>
      </div>
    `,
    iconSize: [95, 30],
    iconAnchor: [47, 15],
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
      map.fitBounds(bounds, { padding: [55, 55], maxZoom: 10 });
    }
  }, [selectedRouteId, routes, map, triggerCenter]);

  return null;
};

// External custom map zoom controls inside Leaflet context
const MapZoomController: React.FC<{
  onZoomIn: (fn: () => void) => void;
  onZoomOut: (fn: () => void) => void;
}> = ({ onZoomIn, onZoomOut }) => {
  const map = useMap();
  useEffect(() => {
    onZoomIn(() => map.zoomIn());
    onZoomOut(() => map.zoomOut());
  }, [map, onZoomIn, onZoomOut]);
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
  selectedCheckpoint,
  originName = "Chicago",
  destinationName = "Dallas",
}) => {
  const [isSatellite, setIsSatellite] = useState(false);
  const [recenterCount, setRecenterCount] = useState(0);
  const [isWeatherDropdownOpen, setIsWeatherDropdownOpen] = useState(false);

  const zoomInRef = React.useRef<() => void>(() => {});
  const zoomOutRef = React.useRef<() => void>(() => {});

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const originCity = originName ? originName.split(",")[0].trim() : "Origin";
  const destCity = destinationName ? destinationName.split(",")[0].trim() : "Destination";

  const startCoords = selectedRoute?.coordinates?.[0];
  const endCoords = selectedRoute?.coordinates?.[selectedRoute.coordinates.length - 1];

  const hasSevereWeather = selectedRoute?.summary?.severe_miles > 0 || selectedRoute?.summary?.has_no_travel;

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-slate-200/90 bg-slate-100 flex flex-col shadow-xs isolate">
      {/* 1. LEAFLET MAP CANVAS */}
      <div className="w-full h-full relative z-0">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          scrollWheelZoom={true}
          className="w-full h-full"
          zoomControl={false}
        >
          <MapBoundsAdjuster
            routes={routes}
            selectedRouteId={selectedRouteId}
            triggerCenter={recenterCount}
          />

          <MapZoomController
            onZoomIn={(fn) => { zoomInRef.current = fn; }}
            onZoomOut={(fn) => { zoomOutRef.current = fn; }}
          />

          {/* Positron Clean Soft Terrain Tiles */}
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

          {/* 2. WEATHER CORRIDOR THERMAL HEATMAP OVERLAY */}
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
                    ? "#eab308"
                    : "#22c55e";

                return (
                  <CircleMarker
                    key={`corridor-pt-${idx}`}
                    center={[pt.lat, pt.lon]}
                    radius={16}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.28,
                      weight: 0,
                    }}
                  />
                );
              })}
            </>
          )}

          {/* 3. INACTIVE ALTERNATIVE ROUTES: Subtle Faded Lines */}
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

          {/* 4. ACTIVE ROUTE POLYLINE: Glowing Emerald Highway Focus Path */}
          {selectedRoute && (
            <>
              {/* Outer Glow Halo */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: "#22c55e",
                  weight: 9,
                  opacity: 0.3,
                }}
              />
              {/* Solid High-Visibility Path with Dashed Pattern matching screenshot */}
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: "#16a34a",
                  weight: 4.5,
                  opacity: 0.95,
                  dashArray: "3, 5",
                }}
              />
            </>
          )}

          {/* 5. ORIGIN & DESTINATION LABELED MARKERS matching screenshot */}
          {startCoords && (
            <Marker
              position={[startCoords[1], startCoords[0]]}
              icon={createOriginMarker(originCity)}
            />
          )}
          {endCoords && (
            <Marker
              position={[endCoords[1], endCoords[0]]}
              icon={createDestinationMarker(destCity)}
            />
          )}

          {/* 6. CHECKPOINT DOTS on Active Route */}
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
                  ? "#eab308"
                  : "#22c55e";

              return (
                <CircleMarker
                  key={`active-cp-${cp.index}`}
                  center={[cp.lat, cp.lon]}
                  radius={isSelected ? 7 : 4.5}
                  pathOptions={{
                    color: isSelected ? "#0f172a" : "#ffffff",
                    fillColor: color,
                    fillOpacity: 1.0,
                    weight: isSelected ? 3 : 1.5,
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

      {/* 7. HIGH-VISIBILITY FLOATING OVERLAYS (RENDERED ON TOP WITH z-[1000]) */}

      {/* Top Left: Risk Legend */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
        <div className="flex items-center space-x-3.5 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-md text-xs font-bold text-slate-800">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]"></span>
            <span className="text-[11px] font-bold text-slate-800">Low</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
            <span className="text-[11px] font-bold text-slate-800">Mod</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span className="text-[11px] font-bold text-slate-800">High</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="text-[11px] font-bold text-slate-800">Severe</span>
          </div>
        </div>
      </div>

      {/* Top Right: [Map View] [Risk Overlay] [Weather Layer ⌄] */}
      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-md">
          {/* Map View Pill */}
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[#101c38] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <MapIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Map View</span>
          </button>

          {/* Risk Overlay Pill */}
          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              showHeatmap
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
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
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition flex items-center gap-1.5"
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-500" />
              <span>Weather Layer</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isWeatherDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-[1100]">
                <button
                  type="button"
                  onClick={() => {
                    setIsSatellite(false);
                    setIsWeatherDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs font-bold transition ${
                    !isSatellite ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Positron Terrain Map
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSatellite(true);
                    setIsWeatherDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs font-bold transition ${
                    isSatellite ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Satellite Imagery
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Left Center: Zoom In / Zoom Out / Recenter Pill Controls */}
      <div className="absolute top-20 left-4 z-[1000] pointer-events-auto">
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => zoomInRef.current?.()}
            className="p-2.5 hover:bg-slate-100 text-slate-700 border-b border-slate-100 transition"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomOutRef.current?.()}
            className="p-2.5 hover:bg-slate-100 text-slate-700 border-b border-slate-100 transition"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setRecenterCount((c) => c + 1)}
            className="p-2.5 hover:bg-slate-100 text-slate-700 transition"
            title="Center on Route"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Left: Weather Alert Floating Card */}
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto max-w-sm">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-lg flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Weather Alert</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              {hasSevereWeather
                ? "Severe weather along your route"
                : "Corridor atmospheric risk monitored"}
            </p>
          </div>
          {onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap ml-1.5 underline"
            >
              View Details →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
