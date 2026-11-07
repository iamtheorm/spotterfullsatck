import React, { useEffect, useState, useMemo, useRef } from "react";
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
  Play,
  Pause,
  RotateCcw,
  Layers,
  CloudSun,
  Truck,
  Plus,
  Minus,
  Crosshair,
  Volume2,
  ChevronDown,
  Box,
  Compass,
  Check,
  Mountain,
  Sun,
  Satellite,
  Moon,
  Map,
} from "lucide-react";
import { playTruckAirHorn } from "../utils/audio";

export type MapViewStyle = "positron" | "terrain" | "satellite" | "dark" | "osm";

interface MapViewOption {
  id: MapViewStyle;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const MAP_VIEW_OPTIONS: MapViewOption[] = [
  {
    id: "positron",
    name: "Clean Dispatch",
    category: "Desaturated Contrast",
    icon: Sun,
    description: "Soft contrast terrain optimized for route and heatmap clarity",
  },
  {
    id: "terrain",
    name: "Topographic Terrain",
    category: "Esri / USGS Topo",
    icon: Mountain,
    description: "Shaded mountain relief, elevation curves, and topography",
  },
  {
    id: "satellite",
    name: "Satellite Hybrid",
    category: "High-Res Aerial",
    icon: Satellite,
    description: "Photorealistic earth imagery with highway boundaries",
  },
  {
    id: "dark",
    name: "Night Operations",
    category: "Dark Mode",
    icon: Moon,
    description: "Midnight dark mode making severe risk markers glow vividly",
  },
  {
    id: "osm",
    name: "Street Navigation",
    category: "OpenStreetMap",
    icon: Map,
    description: "Standard road atlas showing junctions and regional exits",
  },
];

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
  forecastHour?: number;
  onHourChange?: React.Dispatch<React.SetStateAction<number>> | ((hour: number) => void);
  isLoadingCorridor?: boolean;
  selectedCheckpoint?: Checkpoint | null;
  originName?: string;
  destinationName?: string;
}

// Distance helper in meters between two lat/lon coordinates
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Named Marker Pin Icon
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

// Animated Commercial Moving Truck Icon with Headlights Beam
const createMovingTruckIcon = (headingDeg: number = 0) => {
  return L.divIcon({
    className: "custom-animated-truck-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: rotate(${headingDeg}deg); transition: transform 0.2s ease-out;">
        <div style="position: absolute; right: -26px; top: 10px; width: 36px; height: 24px; background: radial-gradient(ellipse at left, rgba(253, 224, 71, 0.9) 0%, rgba(253, 224, 71, 0) 80%); border-radius: 50%; pointer-events: none;"></div>
        <div style="width: 36px; height: 36px; background: #0f172a; border: 2.5px solid #38bdf8; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.5); color: white;">
          <svg style="width: 20px; height: 20px; color: #38bdf8;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
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
  corridorData,
  showHeatmap,
  onToggleHeatmap,
  selectedCheckpoint,
  originName = "Origin",
  destinationName = "Destination",
}) => {
  // Map View Mode: 3D Topo Terrain, Satellite Hybrid, Clean Dispatch, Night Ops, OSM Streets
  const [mapStyle, setMapStyle] = useState<MapViewStyle>("positron");

  const [showCheckpoints, setShowCheckpoints] = useState(true);
  const [recenterCount, setRecenterCount] = useState(0);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);

  // Simulation State: requestAnimationFrame Animation Loop
  const [isPlaying, setIsPlaying] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [activePopoverCP, setActivePopoverCP] = useState<Checkpoint | null>(null);

  // Pending checkpoints that haven't triggered the air horn yet
  const [pendingCheckpoints, setPendingCheckpoints] = useState<Checkpoint[]>([]);

  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const originCity = originName ? originName.split(",")[0].trim() : "Origin";
  const destCity = destinationName ? destinationName.split(",")[0].trim() : "Destination";

  const startCoords = selectedRoute?.coordinates?.[0];
  const endCoords = selectedRoute?.coordinates?.[selectedRoute.coordinates.length - 1];

  const hasSevereWeather =
    selectedRoute?.summary?.severe_miles > 0 || selectedRoute?.summary?.has_no_travel;

  // Reset simulation queue when selected route changes or reset clicked
  const handleResetSimulation = () => {
    setIsPlaying(false);
    setSimProgress(0);
    setActivePopoverCP(null);
    if (selectedRoute?.checkpoints) {
      setPendingCheckpoints([...selectedRoute.checkpoints]);
    }
  };

  useEffect(() => {
    handleResetSimulation();
  }, [selectedRouteId, routes]);

  // Compute interpolated truck position along polyline based on simProgress (0.0 to 1.0)
  const truckState = useMemo(() => {
    if (!selectedRoute?.coordinates || selectedRoute.coordinates.length < 2) {
      return null;
    }
    const coords = selectedRoute.coordinates;
    const totalSegments = coords.length - 1;
    const exactIndex = simProgress * totalSegments;
    const baseIdx = Math.min(Math.floor(exactIndex), totalSegments - 1);
    const fraction = exactIndex - baseIdx;

    const [lon1, lat1] = coords[baseIdx];
    const [lon2, lat2] = coords[baseIdx + 1];

    const currentLat = lat1 + (lat2 - lat1) * fraction;
    const currentLon = lon1 + (lon2 - lon1) * fraction;

    const dy = lat2 - lat1;
    const dx = lon2 - lon1;
    const headingDeg = Math.atan2(dx, dy) * (180 / Math.PI);

    return {
      lat: currentLat,
      lon: currentLon,
      headingDeg,
      baseIdx,
    };
  }, [selectedRoute, simProgress]);

  // Simulation Animation Loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !selectedRoute?.coordinates || selectedRoute.coordinates.length < 2) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const totalDurationMs = 28000; // Complete full trip in ~28 seconds

    const stepAnimation = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setSimProgress((prev) => {
        const next = prev + deltaTime / totalDurationMs;
        if (next >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(stepAnimation);
    };

    animFrameRef.current = requestAnimationFrame(stepAnimation);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, selectedRoute]);

  // Proximity Checkpoint Trigger: Checkpoint within proximity
  useEffect(() => {
    if (!isPlaying || !truckState || pendingCheckpoints.length === 0) return;

    for (let i = 0; i < pendingCheckpoints.length; i++) {
      const cp = pendingCheckpoints[i];
      const dist = getDistanceMeters(truckState.lat, truckState.lon, cp.lat, cp.lon);

      if (dist < 8000) {
        playTruckAirHorn();
        setActivePopoverCP(cp);
        setPendingCheckpoints((prev) =>
          prev.filter((item) => item.index !== cp.index)
        );

        setTimeout(() => {
          setActivePopoverCP((current) =>
            current?.index === cp.index ? null : current
          );
        }, 3200);

        break;
      }
    }
  }, [truckState, isPlaying, pendingCheckpoints]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 flex flex-col isolate">
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

          {/* DYNAMIC BASE MAP TILE LAYERS (100% Free, No Watermark, No API Key Required) */}
          {/* 1. Clean Dispatch (Desaturated Soft Terrain) */}
          {mapStyle === "positron" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles-positron"
            />
          )}

          {/* 2. 3D Topographic Terrain (Shaded Mountain Relief & Elevation Hillshade) */}
          {mapStyle === "terrain" && (
            <>
              <TileLayer
                attribution='&copy; Esri &mdash; National Geographic, Esri, USGS, NASA'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                className="map-tiles-terrain"
              />
              <TileLayer
                attribution='&copy; Esri Elevation'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
                opacity={0.42}
              />
            </>
          )}

          {/* 3. Satellite Imagery with Road & Boundary Labels */}
          {mapStyle === "satellite" && (
            <>
              <TileLayer
                attribution='&copy; Esri, Maxar, Earthstar Geographics'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                className="map-tiles-satellite"
              />
              <TileLayer
                attribution='&copy; Esri'
                url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                opacity={0.88}
              />
            </>
          )}

          {/* 4. Night Operations (Dark Mode) */}
          {mapStyle === "dark" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="map-tiles-dark"
            />
          )}

          {/* 5. Standard Streets (OpenStreetMap) */}
          {mapStyle === "osm" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                      fillOpacity: mapStyle === "dark" ? 0.38 : 0.28,
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
                    color: mapStyle === "dark" ? "#64748b" : "#94a3b8",
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

          {/* 4. ACTIVE ROUTE POLYLINE: Emerald Focus Path */}
          {selectedRoute && (
            <>
              <Polyline
                positions={selectedRoute.coordinates.map(([lon, lat]) => [lat, lon])}
                pathOptions={{
                  color: "#22c55e",
                  weight: 8,
                  opacity: mapStyle === "dark" ? 0.45 : 0.3,
                }}
              />
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

          {/* 5. ORIGIN & DESTINATION LABELED PINS */}
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

          {/* 6. ANIMATED MOVING COMMERCIAL TRUCK MARKER */}
          {truckState && (
            <Marker
              position={[truckState.lat, truckState.lon]}
              icon={createMovingTruckIcon(truckState.headingDeg)}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={0.98} permanent={isPlaying}>
                <div className="font-mono text-center text-xs">
                  <div className="font-black text-sky-600 flex items-center justify-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Freightliner Cascadia</span>
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Progress: {Math.round(simProgress * 100)}% • 62 MPH
                  </div>
                </div>
              </Tooltip>
            </Marker>
          )}

          {/* 7. CHECKPOINT RISK DOTS */}
          {showCheckpoints &&
            selectedRoute?.checkpoints?.map((cp) => {
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
                  <Tooltip direction="top" offset={[0, -8]} opacity={0.96}>
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

      {/* 8. CONSOLIDATED MAP CONTROLS HUD (Pinned Top-Right Corner) */}
      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
        <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-md text-xs">
          {/* Quick Toggle: 3D Topo Terrain */}
          <button
            type="button"
            onClick={() => setMapStyle(mapStyle === "terrain" ? "positron" : "terrain")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              mapStyle === "terrain"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
            title="Toggle 3D Topographic Terrain & Shaded Elevation Relief"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-500" />
            <span>{mapStyle === "terrain" ? "3D Terrain Active" : "3D Terrain"}</span>
          </button>

          {/* Simulation Toggle: Play Route / Pause Route */}
          {selectedRoute && selectedRoute.checkpoints?.length > 0 && (
            <div className="flex items-center space-x-1 px-1 border-x border-slate-200">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  isPlaying
                    ? "bg-amber-500 text-white shadow-xs animate-pulse"
                    : "bg-[#101c38] hover:bg-[#0c162c] text-white shadow-xs"
                }`}
                title={isPlaying ? "Pause Route Simulation" : "Play Route Simulation along checkpoints"}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                    <span>Play Route</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetSimulation}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                title="Reset simulation to beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Consolidated Layers & Map Views Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                isLayersMenuOpen ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Select Base Maps & Layer Overlays"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Views</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu for Base Maps & Overlays */}
            {isLayersMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-[1100] text-xs">
                {/* 1. Base Map Views */}
                <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Base Map Views</span>
                  <Compass className="w-3 h-3 text-slate-400" />
                </div>

                <div className="space-y-1 mt-1">
                  {MAP_VIEW_OPTIONS.map((opt) => {
                    const isSelected = mapStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setMapStyle(opt.id);
                          setIsLayersMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-left flex items-start justify-between transition ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 border border-blue-200"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <div className={`p-1.5 rounded-lg mt-0.5 ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}>
                            <opt.icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1">
                              <span>{opt.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({opt.category})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight">
                              {opt.description}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="my-2 border-t border-slate-100"></div>

                {/* 2. Layer Overlays */}
                <div className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Layer Overlays
                </div>

                <div className="space-y-1">
                  {/* Weather Heatmap Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleHeatmap()}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-slate-700 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Weather Thermal Heatmap</span>
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        showHeatmap ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"
                      }`}
                    ></span>
                  </button>

                  {/* Risk Checkpoints Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCheckpoints(!showCheckpoints)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-slate-700 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                      <span>Risk Checkpoints</span>
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        showCheckpoints ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"
                      }`}
                    ></span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9. ACTIVE CHECKPOINT POPOVER WITH AIR HORN BLAST (Triggered during Simulation) */}
      {activePopoverCP && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
          <div className="bg-slate-900/95 text-white border-2 border-amber-400 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center space-x-3.5 animate-bounce">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black flex items-center gap-2">
                <span>Checkpoint #{activePopoverCP.index} ({activePopoverCP.mile_marker} mi)</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                    activePopoverCP.final_level === "Severe" || activePopoverCP.final_level === "No Travel"
                      ? "bg-red-600 text-white"
                      : activePopoverCP.final_level === "High"
                      ? "bg-orange-500 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {activePopoverCP.final_level} Risk
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                Wind: {activePopoverCP.weather?.wind_mph} mph • Rain: {activePopoverCP.weather?.rain_in_per_hr} in/hr • ETA {activePopoverCP.eta_formatted}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. COMPACT RISK LEGEND (Pinned Top-Left) */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
        <div className="flex items-center space-x-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200/90 shadow-md text-xs font-bold text-slate-800">
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

      {/* 11. MAP ZOOM CONTROLS (Pinned Mid-Left) */}
      <div className="absolute top-16 left-4 z-[1000] pointer-events-auto">
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => zoomInRef.current?.()}
            className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-100 transition"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomOutRef.current?.()}
            className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-100 transition"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setRecenterCount((c) => c + 1)}
            className="p-2 hover:bg-slate-100 text-slate-700 transition"
            title="Recenter Route"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 12. WEATHER ALERT BOX (Bottom-Left) */}
      {hasSevereWeather && (
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto max-w-sm">
          <div className="bg-white/95 backdrop-blur-md border border-red-200/80 rounded-2xl p-3 shadow-md flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-red-900 leading-tight">
                Weather Advisory Along Route
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {selectedRoute?.summary?.severe_miles || 0} mi severe weather monitored on this corridor
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
