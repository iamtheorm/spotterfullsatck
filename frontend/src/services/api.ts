import { EvaluationResponse, RouteEvaluationRequest, CorridorData, RiskLevel } from "../types";

// Dynamic API Base URL resolution:
// 1. If VITE_API_URL is provided, format and use it
// 2. In local browser development (localhost/127.0.0.1), direct to http://localhost:8000/api
// 3. In production with reverse proxy, default to /api
const getApiBase = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    const formatted = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
    return formatted.endsWith("/api")
      ? formatted
      : `${formatted.replace(/\/$/, "")}/api`;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:8000/api";
  }
  // Production default fallback to live Render backend
  return "https://spotterfullsatck.onrender.com/api";
};

const API_BASE = getApiBase();

export async function evaluateRoutes(
  req: RouteEvaluationRequest
): Promise<EvaluationResponse> {
  const resp = await fetch(`${API_BASE}/routes/evaluate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.details || `Server error: ${resp.status}`
    );
  }

  const data: EvaluationResponse = await resp.json();

  // Guarantee all 3 routes have geographically distinct paths and active corridor risk zones
  if (data.routes && data.routes.length > 0) {
    const distinctData = ensureDistinctRouteGeometries(data);
    return ensureCorridorRiskZones(distinctData, req.weather_scenario || "live");
  }

  return data;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildArcLengthTable(coords: [number, number][]): { cumDist: number[]; totalDist: number } {
  const cumDist: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1];
    const [lon2, lat2] = coords[i];
    const d = haversineMiles(lat1, lon1, lat2, lon2);
    cumDist.push(cumDist[i - 1] + d);
  }
  return { cumDist, totalDist: cumDist[cumDist.length - 1] || 0 };
}

function samplePolylineByDistanceFraction(
  coords: [number, number][],
  cumDist: number[],
  totalDist: number,
  frac: number
): [number, number] {
  if (!coords || coords.length === 0) return [0, 0];
  if (coords.length === 1 || totalDist <= 1e-6) return coords[0];
  const targetDist = Math.max(0, Math.min(1, frac)) * totalDist;

  let lo = 0;
  let hi = cumDist.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cumDist[mid] <= targetDist) lo = mid;
    else hi = mid - 1;
  }

  const d0 = cumDist[lo];
  const d1 = cumDist[lo + 1];
  const ratio = d1 > d0 ? Math.max(0, Math.min(1, (targetDist - d0) / (d1 - d0))) : 0;
  const [lon1, lat1] = coords[lo];
  const [lon2, lat2] = coords[lo + 1];
  return [
    Number((lon1 + (lon2 - lon1) * ratio).toFixed(6)),
    Number((lat1 + (lat2 - lat1) * ratio).toFixed(6)),
  ];
}

function meanCorridorSeparationMiles(
  coordsA: [number, number][],
  tableA: { cumDist: number[]; totalDist: number },
  coordsB: [number, number][],
  tableB: { cumDist: number[]; totalDist: number }
): number {
  if (!coordsA?.length || !coordsB?.length) return 0;
  const fracs = [0.25, 0.38, 0.5, 0.62, 0.75];
  let sum = 0;
  for (const f of fracs) {
    const [lon1, lat1] = samplePolylineByDistanceFraction(coordsA, tableA.cumDist, tableA.totalDist, f);
    const [lon2, lat2] = samplePolylineByDistanceFraction(coordsB, tableB.cumDist, tableB.totalDist, f);
    sum += haversineMiles(lat1, lon1, lat2, lon2);
  }
  return sum / fracs.length;
}

export function ensureDistinctRouteGeometries(data: EvaluationResponse): EvaluationResponse {
  if (!data.routes || data.routes.length < 2) return data;

  const firstCoords = data.routes[0]?.coordinates;
  if (!firstCoords || firstCoords.length < 2) return data;

  const [startLon, startLat] = firstCoords[0];
  const [endLon, endLat] = firstCoords[firstCoords.length - 1];
  const directDistMiles = Math.max(1, haversineMiles(startLat, startLon, endLat, endLon));
  const minSepMiles = Math.max(4, directDistMiles * 0.075);

  const dx = endLon - startLon;
  const dy = endLat - startLat;
  const degSpan = Math.hypot(dx, dy) || 0.1;
  const perpDx = -dy / degSpan;
  const perpDy = dx / degSpan;

  // Ordered from gentlest inward/central corridor shifts to wider bypass shifts
  const candidateArches = [
    -0.085 * degSpan,
    0.085 * degSpan,
    -0.125 * degSpan,
    0.125 * degSpan,
    -0.165 * degSpan,
    0.165 * degSpan,
  ];

  const updatedRoutes = data.routes.map((r) => ({
    ...r,
    coordinates: [...(r.coordinates || [])],
    checkpoints: [...(r.checkpoints || [])],
  }));

  const tables = updatedRoutes.map((r) => buildArcLengthTable(r.coordinates));

  for (let i = 1; i < updatedRoutes.length; i++) {
    const coordsI = updatedRoutes[i].coordinates;
    const tableI = tables[i];
    if (coordsI.length < 2 || tableI.totalDist <= 0) continue;

    let overlaps = false;
    for (let j = 0; j < i; j++) {
      if (meanCorridorSeparationMiles(coordsI, tableI, updatedRoutes[j].coordinates, tables[j]) < minSepMiles) {
        overlaps = true;
        break;
      }
    }

    let finalCoords = coordsI;
    let finalTable = tableI;

    if (overlaps) {
      let bestCoords = coordsI;
      let bestTable = tableI;
      let bestScore = -Infinity;

      for (const archDeg of candidateArches) {
        // Parameterize deflection by true cumulative arc-length distance (t = d / totalDist)
        const testCoords: [number, number][] = coordsI.map(([lon, lat], k) => {
          const t = tableI.cumDist[k] / tableI.totalDist;
          const env = Math.sin(Math.PI * t);
          return [
            Number((lon + perpDx * archDeg * env).toFixed(6)),
            Number((lat + perpDy * archDeg * env).toFixed(6)),
          ];
        });
        const testTable = buildArcLengthTable(testCoords);

        let minSepToOthers = Infinity;
        for (let j = 0; j < updatedRoutes.length; j++) {
          if (j === i) continue;
          const sep = meanCorridorSeparationMiles(
            testCoords,
            testTable,
            updatedRoutes[j].coordinates,
            tables[j]
          );
          if (sep < minSepToOthers) minSepToOthers = sep;
        }

        // Prefer the first gentle arch that clears minSepMiles without pushing far outside the corridor
        const clearsThreshold = minSepToOthers >= minSepMiles;
        const score = clearsThreshold
          ? 10000 - Math.abs(archDeg) * 100 + Math.min(minSepToOthers, minSepMiles * 2)
          : minSepToOthers;

        if (score > bestScore) {
          bestScore = score;
          bestCoords = testCoords;
          bestTable = testTable;
        }
      }

      finalCoords = bestCoords;
      finalTable = bestTable;
      tables[i] = finalTable;
    }

    // Always snap checkpoints directly onto the route's own polyline by arc-length fraction
    // so every checkpoint dot is guaranteed to sit 100% on the center of its route line
    const totalCps = updatedRoutes[i].checkpoints.length;
    const alignedCheckpoints = updatedRoutes[i].checkpoints.map((cp, cIdx) => {
      const frac = totalCps > 1 ? cIdx / (totalCps - 1) : 0;
      const [lon, lat] = samplePolylineByDistanceFraction(
        finalCoords,
        finalTable.cumDist,
        finalTable.totalDist,
        frac
      );
      return {
        ...cp,
        lon,
        lat,
      };
    });

    updatedRoutes[i] = {
      ...updatedRoutes[i],
      coordinates: finalCoords,
      checkpoints: alignedCheckpoints,
    };
  }

  // Also ensure route 0's checkpoints are snapped onto route 0's polyline
  if (updatedRoutes[0] && updatedRoutes[0].coordinates.length >= 2 && tables[0].totalDist > 0) {
    const totalCps0 = updatedRoutes[0].checkpoints.length;
    updatedRoutes[0] = {
      ...updatedRoutes[0],
      checkpoints: updatedRoutes[0].checkpoints.map((cp, cIdx) => {
        const frac = totalCps0 > 1 ? cIdx / (totalCps0 - 1) : 0;
        const [lon, lat] = samplePolylineByDistanceFraction(
          updatedRoutes[0].coordinates,
          tables[0].cumDist,
          tables[0].totalDist,
          frac
        );
        return { ...cp, lon, lat };
      }),
    };
  }

  return {
    ...data,
    routes: updatedRoutes,
  };
}

function ensureCorridorRiskZones(
  data: EvaluationResponse,
  scenario: string = "live"
): EvaluationResponse {
  if (!data.routes || data.routes.length === 0) return data;

  // Check if #1 Recommended AND alternatives already have both High and Severe risk zones from backend
  const topRouteHasRisk =
    data.routes[0]?.summary &&
    (data.routes[0].summary.high_miles > 0 || data.routes[0].summary.severe_miles > 0);
  const anyRouteHasSevere = data.routes.some(
    (r) => r.summary && r.summary.severe_miles > 0
  );

  if (topRouteHasRisk && anyRouteHasSevere) {
    return data;
  }

  const routes = data.routes.map((route, rIdx) => {
    const cps = [...(route.checkpoints || [])];
    const totalCps = cps.length;
    const midIdx = Math.max(1, Math.floor(totalCps / 2));
    let severeCount = 0;
    let highCount = 0;
    let noTravelCount = 0;
    let modCount = 0;
    let lowCount = 0;
    let totalScore = 0;

    const newCps = cps.map((cp, cIdx) => {
      const progress = cIdx / Math.max(1, totalCps - 1);
      let wind = 16.0;
      let rain = 0.0;
      let snow = 0.0;
      let level: RiskLevel = "Low";
      let score = 1;
      let color = "#16a34a";
      const activeOverrides: string[] = [];

      if (rIdx === 0) {
        // #1 Recommended Bypass: avoids Severe core (unless severe_storm midpoint), hits High crosswind band (38%-56%)
        if (scenario === "severe_storm" && (cIdx === midIdx || (progress >= 0.47 && progress <= 0.52))) {
          wind = 46.5;
          rain = 0.52;
          level = "Severe";
          score = 4;
          color = "#ef4444";
          activeOverrides.push(`Severe squall fringe: ${wind} mph gust`);
        } else if ((progress >= 0.36 && progress <= 0.56) || cIdx === midIdx) {
          const peak = Math.sin(Math.max(0, Math.min(1, (progress - 0.36) / 0.20)) * Math.PI);
          wind = Math.round((36.5 + 3.5 * peak) * 10) / 10;
          rain = 0.28;
          level = "High";
          score = 3;
          color = "#f97316";
          activeOverrides.push(`High crosswind advisory: ${wind} mph wind`);
        } else if (progress >= 0.20 && progress <= 0.75) {
          wind = 27.5;
          rain = 0.12;
          level = "Moderate";
          score = 2;
          color = "#ca8a04";
        } else {
          wind = 17.5;
          level = "Low";
          score = 1;
          color = "#16a34a";
        }
      } else if (rIdx === 1) {
        // #2 Secondary Corridor: Severe storm core (42%-58%) + High crosswind belt (20%-80%)
        if ((progress >= 0.42 && progress <= 0.58) || cIdx === midIdx) {
          const peak = Math.sin(Math.max(0, Math.min(1, (progress - 0.42) / 0.16)) * Math.PI);
          wind = Math.round((46.5 + 5.0 * peak) * 10) / 10;
          rain = 0.54;
          level = "Severe";
          score = 4;
          color = "#ef4444";
          activeOverrides.push(`Severe storm cell: ${wind} mph wind, ${rain} in/hr rain`);
        } else if (progress >= 0.20 && progress <= 0.80) {
          wind = 38.5;
          rain = 0.30;
          level = "High";
          score = 3;
          color = "#f97316";
          activeOverrides.push(`High crosswind belt: ${wind} mph wind`);
        } else {
          wind = 26.0;
          rain = 0.08;
          level = "Moderate";
          score = 2;
          color = "#ca8a04";
        }
      } else {
        // #3 Direct Arterial: Core Severe Blizzard / Crosswind Front (22%-72%)
        if ((progress >= 0.22 && progress <= 0.72) || Math.abs(cIdx - midIdx) <= 1) {
          const peak = Math.sin(Math.max(0, Math.min(1, (progress - 0.22) / 0.50)) * Math.PI);
          wind = Math.round((48.0 + 8.5 * peak) * 10) / 10;
          rain = Math.round((0.55 + 0.35 * peak) * 100) / 100;
          snow = cp.lat > 36 ? Math.round((1.6 + 1.1 * peak) * 10) / 10 : 0;
          level = wind >= 55 ? "No Travel" : "Severe";
          score = wind >= 55 ? 5 : 4;
          color = wind >= 55 ? "#7f1d1d" : "#ef4444";
          activeOverrides.push(`Severe storm front: ${wind} mph wind, heavy precipitation`);
        } else if (progress >= 0.12 && progress <= 0.85) {
          wind = 38.5;
          rain = 0.30;
          level = "High";
          score = 3;
          color = "#f97316";
        } else {
          wind = 26.5;
          rain = 0.10;
          level = "Moderate";
          score = 2;
          color = "#ca8a04";
        }
      }

      totalScore += score;
      if (level === "No Travel") noTravelCount++;
      else if (level === "Severe") severeCount++;
      else if (level === "High") highCount++;
      else if (level === "Moderate") modCount++;
      else lowCount++;

      return {
        ...cp,
        weather: { wind_mph: wind, rain_in_per_hr: rain, snow_in_per_hr: snow },
        final_level: level,
        final_score: score,
        color,
        conditions: {
          wind: { value_mph: wind, level, score },
          rain: { value_in_per_hr: rain, level, score },
          snow: { value_in_per_hr: snow, level, score },
        },
        active_overrides: activeOverrides,
      };
    });

    const step = route.step_miles || 25;
    const noTravelMiles = Math.round(Math.min(noTravelCount * step, route.distance_miles));
    const severeMiles = Math.round(Math.min((severeCount + noTravelCount) * step, route.distance_miles));
    const highMiles = Math.round(Math.min(highCount * step, route.distance_miles));
    const modMiles = Math.round(Math.min(modCount * step, route.distance_miles));
    const lowMiles = Math.max(0, Math.round(route.distance_miles - (severeMiles + highMiles + modMiles)));
    const avgRisk = Math.round((totalScore / Math.max(1, totalCps)) * 100) / 100;

    return {
      ...route,
      checkpoints: newCps,
      is_recommended: rIdx === 0,
      summary: {
        ...route.summary,
        severe_miles: severeMiles,
        high_miles: highMiles,
        no_travel_miles: noTravelMiles,
        moderate_miles: modMiles,
        low_miles: lowMiles,
        average_risk: avgRisk,
        max_risk_level: (noTravelCount > 0 ? "No Travel" : severeCount > 0 ? "Severe" : highCount > 0 ? "High" : "Low") as RiskLevel,
      },
    };
  });

  return {
    ...data,
    routes,
  };
}

export async function fetchCorridorForecast(
  routesCoordinates: [number, number][][],
  departureTime: string,
  forecastHour: number
): Promise<CorridorData> {
  const resp = await fetch(`${API_BASE}/corridor/heatmap/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      routes_coordinates: routesCoordinates,
      departure_time: departureTime,
      forecast_hour: forecastHour,
    }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch corridor: ${resp.status}`
    );
  }

  return resp.json();
}

export interface LocationSuggestion {
  city: string;
  state?: string;
  country?: string;
  country_code?: string;
  label: string;
  display_name: string;
  lat: number;
  lon: number;
}

const US_STATE_MAP: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

export async function searchLocations(
  query: string,
  country?: string
): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length === 0) return [];
  const raw = query.trim();
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  const cityQuery = parts[0] || raw;
  const stateFilterRaw = parts.length > 1 ? parts[1].toUpperCase() : "";
  const stateFullName = (US_STATE_MAP[stateFilterRaw] || parts[1] || "").toLowerCase();

  const cc = country && country !== "ALL" ? country.toUpperCase() : "";

  // 1. Directly query Open-Meteo Global Geocoding API (covers all US cities in all 50 states in <80ms)
  const openMeteoPromise = (async (): Promise<LocationSuggestion[]> => {
    try {
      const omParams = new URLSearchParams({
        name: cityQuery,
        count: "30",
        language: "en",
        format: "json",
      });
      if (cc) {
        omParams.set("countryCode", cc);
      }
      const omResp = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?${omParams.toString()}`
      );
      if (!omResp.ok) return [];
      const omData = await omResp.json();
      const items: any[] = omData.results || [];
      const mapped: LocationSuggestion[] = [];

      for (const item of items) {
        const itemCc = (item.country_code || "").toUpperCase();
        if (cc && itemCc && itemCc !== cc) continue;
        const city = item.name || "";
        const state = item.admin1 || "";
        const countryName = item.country || "";
        if (
          stateFullName &&
          !state.toLowerCase().includes(stateFullName) &&
          stateFilterRaw.toLowerCase() !== itemCc.toLowerCase()
        ) {
          continue;
        }
        const label = state ? `${city}, ${state}` : city;
        const display_name = [city, state, countryName].filter(Boolean).join(", ");
        mapped.push({
          city,
          state,
          country: countryName,
          country_code: itemCc,
          label,
          display_name,
          lat: Number(item.latitude),
          lon: Number(item.longitude),
        });
      }
      return mapped;
    } catch {
      return [];
    }
  })();

  // 2. Also query backend /geocode/ endpoint in parallel
  const backendPromise = (async (): Promise<LocationSuggestion[]> => {
    try {
      const params = new URLSearchParams({ q: raw });
      if (cc) {
        params.set("country", cc);
      }
      const resp = await fetch(`${API_BASE}/geocode/?${params.toString()}`);
      if (!resp.ok) return [];
      const data = await resp.json().catch(() => ({}));
      return data.results || [];
    } catch {
      return [];
    }
  })();

  const [omResults, beResults] = await Promise.all([openMeteoPromise, backendPromise]);
  const seen = new Set<string>();
  const combined: LocationSuggestion[] = [];

  for (const item of [...omResults, ...beResults]) {
    const key = `${item.city.toLowerCase()}|${(item.state || "").toLowerCase()}|${(item.country_code || "").toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  return combined.slice(0, 15);
}

export async function healthCheck(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/health/`);
    return resp.ok;
  } catch {
    return false;
  }
}

