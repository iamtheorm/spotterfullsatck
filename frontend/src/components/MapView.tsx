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
import { RouteOption, Checkpoint, CorridorData, DistanceUnit } from "../types";
import {
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
  Clock,
  Shield,
} from "lucide-react";
import { playTruckAirHorn } from "../utils/audio";

export type MapViewStyle = "positron" | "terrain" | "satellite" | "dark" | "osm";

interface MapViewOption {
  id: MapViewStyle;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MAP_VIEW_OPTIONS: MapViewOption[] = [
  { id: "positron", name: "Clean Dispatch", icon: Sun },
  { id: "terrain", name: "Topographic Terrain", icon: Mountain },
  { id: "satellite", name: "Satellite Hybrid", icon: Satellite },
  { id: "dark", name: "Night Operations", icon: Moon },
  { id: "osm", name: "Street Navigation", icon: Map },
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
  distanceUnit?: DistanceUnit;
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

// Animated Commercial 18-Wheeler Moving Semi-Truck Vehicle with Headlights Beam
const createMovingTruckIcon = (headingDeg: number = 0) => {
  return L.divIcon({
    className: "custom-animated-truck-marker",
    html: `
      <div style="position: relative; width: 36px; height: 74px; transform: rotate(${headingDeg}deg); transition: transform 0.25s linear; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.6)); pointer-events: none;">
        <!-- Forward Headlight Beams Cone -->
        <div style="position: absolute; top: -38px; left: -14px; width: 64px; height: 44px; background: radial-gradient(ellipse at 50% 100%, rgba(254, 240, 138, 0.8) 0%, rgba(253, 224, 71, 0.35) 45%, rgba(253, 224, 71, 0) 80%); clip-path: polygon(28% 100%, 72% 100%, 100% 0%, 0% 0%); pointer-events: none; z-index: 1;"></div>
        
        <!-- Top-Down Class 8 Semi-Truck Vehicle Sprite -->
        <svg width="36" height="74" viewBox="0 0 36 74" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; z-index: 2; position: relative;">
          <!-- Dual Tandem Trailer Axles -->
          <rect x="2" y="47" width="4" height="9" rx="1.5" fill="#0f172a" />
          <rect x="30" y="47" width="4" height="9" rx="1.5" fill="#0f172a" />
          <rect x="2" y="58" width="4" height="9" rx="1.5" fill="#0f172a" />
          <rect x="30" y="58" width="4" height="9" rx="1.5" fill="#0f172a" />

          <!-- 53ft White Freight Trailer Body -->
          <rect x="5" y="23" width="26" height="47" rx="3" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
          <!-- Trailer Structural Ribs -->
          <line x1="7" y1="28" x2="29" y2="28" stroke="#cbd5e1" stroke-width="1" />
          <line x1="7" y1="34" x2="29" y2="34" stroke="#cbd5e1" stroke-width="1" />
          <line x1="7" y1="40" x2="29" y2="40" stroke="#cbd5e1" stroke-width="1" />
          <line x1="7" y1="46" x2="29" y2="46" stroke="#cbd5e1" stroke-width="1" />
          <line x1="7" y1="52" x2="29" y2="52" stroke="#cbd5e1" stroke-width="1" />
          <line x1="7" y1="58" x2="29" y2="58" stroke="#cbd5e1" stroke-width="1" />
          <line x1="7" y1="64" x2="29" y2="64" stroke="#cbd5e1" stroke-width="1" />

          <!-- Trailer Rear Stop / Brake Lights -->
          <rect x="5.5" y="68.5" width="4" height="1.5" rx="0.5" fill="#ef4444" />
          <rect x="26.5" y="68.5" width="4" height="1.5" rx="0.5" fill="#ef4444" />
          <rect x="10" y="69" width="16" height="1" fill="#334155" />

          <!-- Fifth Wheel Hitch -->
          <rect x="14" y="19" width="8" height="6" rx="1" fill="#334155" />

          <!-- Tractor Drive Axle Wheels -->
          <rect x="3" y="16" width="3.5" height="7" rx="1.5" fill="#0f172a" />
          <rect x="29.5" y="16" width="3.5" height="7" rx="1.5" fill="#0f172a" />

          <!-- Front Steer Axle Wheels -->
          <rect x="3" y="5" width="3.5" height="7" rx="1.5" fill="#0f172a" />
          <rect x="29.5" y="5" width="3.5" height="7" rx="1.5" fill="#0f172a" />

          <!-- Tractor Cabin (Class 8 Long-Haul Cab) -->
          <rect x="6" y="11" width="24" height="11" rx="2.5" fill="#1e3a8a" stroke="#172554" stroke-width="1" />
          <!-- Aerodynamic Cab Extenders -->
          <path d="M6 13 L4 21 L7 21 Z" fill="#2563eb" />
          <path d="M30 13 L32 21 L29 21 Z" fill="#2563eb" />

          <!-- Hood & Front Engine Compartment -->
          <path d="M8 11 L9 3 C9 1.8 10.5 1 13 1 L23 1 C25.5 1 27 1.8 27 3 L28 11 Z" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" />
          <!-- Chrome Front Grill -->
          <path d="M12 1.5 L24 1.5 L23 4 L13 4 Z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="0.5" />
          <line x1="14" y1="2.6" x2="22" y2="2.6" stroke="#475569" stroke-width="0.5" />

          <!-- Curved Windshield -->
          <path d="M10 9 C11 7.2 13 6.8 18 6.8 C23 6.8 25 7.2 26 9 L25 11.5 L11 11.5 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="0.8" />
          <!-- Roof Clearance Amber Marker Lights -->
          <circle cx="13" cy="5.8" r="0.8" fill="#f59e0b" />
          <circle cx="18" cy="5.5" r="0.8" fill="#f59e0b" />
          <circle cx="23" cy="5.8" r="0.8" fill="#f59e0b" />

          <!-- Chrome Exhaust Stacks -->
          <circle cx="8" cy="12" r="1.3" fill="#e2e8f0" stroke="#475569" stroke-width="0.6" />
          <circle cx="28" cy="12" r="1.3" fill="#e2e8f0" stroke="#475569" stroke-width="0.6" />

          <!-- Dual Side Mirrors -->
          <rect x="2" y="7.5" width="4" height="1.6" rx="0.5" fill="#cbd5e1" stroke="#475569" stroke-width="0.5" />
          <rect x="30" y="7.5" width="4" height="1.6" rx="0.5" fill="#cbd5e1" stroke="#475569" stroke-width="0.5" />

          <!-- Front Headlights Bulbs -->
          <circle cx="10.5" cy="2" r="1.2" fill="#fef08a" />
          <circle cx="25.5" cy="2" r="1.2" fill="#fef08a" />
        </svg>
      </div>
    `,
    iconSize: [36, 74],
    iconAnchor: [18, 37],
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
  forecastHour = 0,
  onHourChange,
  selectedCheckpoint,
  originName = "Origin",
  destinationName = "Destination",
  distanceUnit = "mi",
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

  // Reset simulation queue when selected route changes or reset clicked
  const handleResetSimulation = () => {
    setIsPlaying(false);
    setSimProgress(0);
    setActivePopoverCP(null);
    if (selectedRoute?.checkpoints) {
      setPendingCheckpoints([...selectedRoute.checkpoints]);
    }
    if (onHourChange) {
      onHourChange(0);
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

  // Dynamic Weather Heatmap Sync: as the truck drives towards destination, update forecast hour
  useEffect(() => {
    if (!isPlaying || !selectedRoute) return;
    const totalHours = selectedRoute.duration_hours || 6;
    const currentSimHour = Math.min(48, Math.max(0, Math.round(simProgress * totalHours)));
    if (onHourChange && currentSimHour !== forecastHour) {
      onHourChange(currentSimHour);
    }
  }, [isPlaying, simProgress, selectedRoute, forecastHour, onHourChange]);

  // Nearest checkpoint to current truck location for live weather telemetry
  const currentNearestCp = useMemo(() => {
    if (!truckState || !selectedRoute?.checkpoints || selectedRoute.checkpoints.length === 0) return null;
    let closest: Checkpoint | null = null;
    let minDist = Infinity;
    for (const cp of selectedRoute.checkpoints) {
      const d = getDistanceMeters(truckState.lat, truckState.lon, cp.lat, cp.lon);
      if (d < minDist) {
        minDist = d;
        closest = cp;
      }
    }
    return closest;
  }, [truckState, selectedRoute]);

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
        const isHighRiskOrAbove =
          cp.final_level === "High" ||
          cp.final_level === "Severe" ||
          cp.final_level === "No Travel" ||
          cp.final_score >= 3;

        // Sound the pneumatic air horn only in areas of high risk and above
        if (isHighRiskOrAbove) {
          playTruckAirHorn();
        }

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
          minZoom={3}
          maxZoom={18}
          maxBounds={[
            [-85.05112878, -180],
            [85.05112878, 180],
          ]}
          maxBoundsViscosity={1.0}
          worldCopyJump={true}
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
                    ? "#7f1d1d"
                    : pt.risk_level === "Severe"
                    ? "#dc2626"
                    : pt.risk_level === "High"
                    ? "#ea580c"
                    : pt.risk_level === "Moderate"
                    ? "#ca8a04"
                    : "#16a34a";

                return (
                  <CircleMarker
                    key={`corridor-pt-${idx}`}
                    center={[pt.lat, pt.lon]}
                    radius={34}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: mapStyle === "dark" ? 0.45 : 0.35,
                      weight: 1.5,
                      opacity: mapStyle === "dark" ? 0.6 : 0.4,
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
              <Tooltip direction="top" offset={[0, -42]} opacity={0.98} permanent={isPlaying}>
                <div className="font-mono text-center text-xs">
                  <div className="font-black text-sky-600 flex items-center justify-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Commercial Freightliner</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold">
                    {Math.round(simProgress * 100)}% • {distanceUnit === "km" ? "100 km/h" : "62 mph"}
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
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-[1100] text-xs">
                {/* 1. Base Map Views */}
                <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Base Map Views</span>
                  <Compass className="w-3 h-3 text-slate-400" />
                </div>

                <div className="space-y-0.5 mt-1">
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
                        className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 font-bold"
                            : "hover:bg-slate-50 text-slate-700 font-semibold"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}>
                            <opt.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs">{opt.name}</span>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="my-1.5 border-t border-slate-100"></div>

                {/* 2. Layer Overlays */}
                <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Layer Overlays
                </div>

                <div className="space-y-0.5">
                  {/* Weather Heatmap Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleHeatmap()}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <span className="flex items-center gap-2 text-xs">
                      <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Weather Heatmap</span>
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        showHeatmap ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"
                      }`}
                    ></span>
                  </button>

                  {/* Risk Checkpoints Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCheckpoints(!showCheckpoints)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    <span className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                      <span>Risk Checkpoints</span>
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
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
      {activePopoverCP && (() => {
        const isHighRiskOrAbove =
          activePopoverCP.final_level === "High" ||
          activePopoverCP.final_level === "Severe" ||
          activePopoverCP.final_level === "No Travel" ||
          activePopoverCP.final_score >= 3;

        return (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
            <div
              className={`bg-slate-900/95 text-white border-2 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center space-x-3.5 ${
                isHighRiskOrAbove ? "border-amber-400 animate-bounce" : "border-slate-700"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isHighRiskOrAbove
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                }`}
              >
                {isHighRiskOrAbove ? (
                  <Volume2 className="w-4 h-4 animate-pulse" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-black flex items-center gap-2">
                  <span>
                    Checkpoint #{activePopoverCP.index} (
                    {distanceUnit === "km"
                      ? `${Math.round(activePopoverCP.mile_marker * 1.60934)} km`
                      : `${activePopoverCP.mile_marker} mi`}
                    )
                  </span>
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
                  Wind: {activePopoverCP.weather?.wind_mph} mph • Rain:{" "}
                  {activePopoverCP.weather?.rain_in_per_hr} in/hr • ETA {activePopoverCP.eta_formatted}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 9b. LIVE DISPATCH SIMULATION TELEMETRY HUD (Active when truck is moving) */}
      {(isPlaying || simProgress > 0) && selectedRoute && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto max-w-xl w-[92%] sm:w-auto">
          <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center space-x-3.5">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                {isPlaying ? "Sim En Route" : "Sim Paused"}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700 shrink-0"></div>

            <div className="flex items-center space-x-2 min-w-[130px]">
              <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-emerald-400 h-1.5 rounded-full transition-all duration-150"
                  style={{ width: `${Math.round(simProgress * 100)}%` }}
                ></div>
              </div>
              <span className="font-mono text-[10px] text-slate-300 font-bold shrink-0">
                {Math.round(simProgress * 100)}%
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700 shrink-0"></div>

            <div className="text-[11px] text-slate-300 flex items-center gap-1.5 shrink-0">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>
                +{(simProgress * (selectedRoute.duration_hours || 6)).toFixed(1)}h / {selectedRoute.duration_hours}h
              </span>
            </div>

            {currentNearestCp && (
              <>
                <div className="h-4 w-px bg-slate-700 shrink-0 hidden sm:block"></div>
                <div className="text-[10px] text-slate-300 hidden sm:flex items-center gap-1.5 shrink-0">
                  <span>Wind: <strong>{currentNearestCp.weather?.wind_mph || 14} mph</strong></span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                      currentNearestCp.final_level === "Severe" || currentNearestCp.final_level === "No Travel"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : currentNearestCp.final_level === "High"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {currentNearestCp.final_level}
                  </span>
                </div>
              </>
            )}
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
    </div>
  );
};
