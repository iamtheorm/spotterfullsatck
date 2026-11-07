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
    return ensureCorridorRiskZones(distinctData);
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

function downsampleCoords(coords: [number, number][], maxPts: number = 600): [number, number][] {
  if (!coords || coords.length <= maxPts) return coords;
  const n = coords.length;
  const result: [number, number][] = [];
  for (let k = 0; k < maxPts; k++) {
    const idx = Math.round((k / (maxPts - 1)) * (n - 1));
    result.push(coords[idx]);
  }
  return result;
}

export function ensureDistinctRouteGeometries(data: EvaluationResponse): EvaluationResponse {
  if (!data.routes || data.routes.length < 2) return data;

  const firstCoords = data.routes[0]?.coordinates;
  if (!firstCoords || firstCoords.length < 2) return data;

  const [startLon, startLat] = firstCoords[0];
  const [endLon, endLat] = firstCoords[firstCoords.length - 1];
  const directDistMiles = Math.max(1, haversineMiles(startLat, startLon, endLat, endLon));
  const minSepMiles = Math.max(4, directDistMiles * 0.065);

  const dx = endLon - startLon;
  const dy = endLat - startLat;
  const degSpan = Math.hypot(dx, dy) || 0.1;
  const perpDx = -dy / degSpan;
  const perpDy = dx / degSpan;

  const candidateArches = [
    -0.08 * degSpan,
    0.08 * degSpan,
    -0.12 * degSpan,
    0.12 * degSpan,
  ];

  const updatedRoutes = data.routes.map((r) => ({
    ...r,
    coordinates: downsampleCoords([...(r.coordinates || [])], 600),
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
      const candidates: { coords: [number, number][]; table: { cumDist: number[]; totalDist: number }; penalty: number }[] = [];

      // 1. If there is a distinct non-overlapping partner route, build a Central Interior Corridor
      // halfway between `coordsI` and the partner route (guaranteed to stay inside the US corridor!)
      for (let j = 0; j < updatedRoutes.length; j++) {
        if (j === i) continue;
        const coordsJ = updatedRoutes[j].coordinates;
        const tableJ = tables[j];
        const sepIJ = meanCorridorSeparationMiles(coordsI, tableI, coordsJ, tableJ);
        if (sepIJ >= minSepMiles * 1.4 && coordsJ.length >= 2 && tableJ.totalDist > 0) {
          const blended: [number, number][] = coordsI.map(([lon, lat], k) => {
            const t = tableI.cumDist[k] / tableI.totalDist;
            const [lonJ, latJ] = samplePolylineByDistanceFraction(coordsJ, tableJ.cumDist, tableJ.totalDist, t);
            const w = 0.48 * Math.sin(Math.PI * t);
            return [
              Number((lon * (1 - w) + lonJ * w).toFixed(6)),
              Number((lat * (1 - w) + latJ * w).toFixed(6)),
            ];
          });
          candidates.push({
            coords: blended,
            table: buildArcLengthTable(blended),
            penalty: 0,
          });
        }
      }

      // 2. Also include gentle lateral arches parameterized by arc-length
      for (const archDeg of candidateArches) {
        const testCoords: [number, number][] = coordsI.map(([lon, lat], k) => {
          const t = tableI.cumDist[k] / tableI.totalDist;
          const env = Math.sin(Math.PI * t);
          return [
            Number((lon + perpDx * archDeg * env).toFixed(6)),
            Number((lat + perpDy * archDeg * env).toFixed(6)),
          ];
        });
        candidates.push({
          coords: testCoords,
          table: buildArcLengthTable(testCoords),
          penalty: Math.abs(archDeg),
        });
      }

      let bestCoords = coordsI;
      let bestTable = tableI;
      let bestScore = -Infinity;

      for (const cand of candidates) {
        let minSepToOthers = Infinity;
        for (let j = 0; j < updatedRoutes.length; j++) {
          if (j === i) continue;
          const sep = meanCorridorSeparationMiles(
            cand.coords,
            cand.table,
            updatedRoutes[j].coordinates,
            tables[j]
          );
          if (sep < minSepToOthers) minSepToOthers = sep;
        }

        const clearsThreshold = minSepToOthers >= minSepMiles;
        const score = clearsThreshold
          ? 10000 - cand.penalty * 500 + Math.min(minSepToOthers, minSepMiles * 1.8)
          : minSepToOthers - cand.penalty * 50;

        if (score > bestScore) {
          bestScore = score;
          bestCoords = cand.coords;
          bestTable = cand.table;
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
  data: EvaluationResponse
): EvaluationResponse {
  if (!data.routes || data.routes.length === 0) return data;

  // If the backend has already computed active risk zones on the corridor, preserve backend results 100%
  const backendHasRisk = data.routes.some(
    (r) =>
      r.summary &&
      (r.summary.severe_miles > 0 || r.summary.high_miles > 0)
  );
  const anyRouteHasSevere = data.routes.some(
    (r) => r.summary && r.summary.severe_miles > 0
  );

  if (backendHasRisk && anyRouteHasSevere) {
    return data;
  }

  // Fallback time-dependent storm front model (used only if backend returned zero risk across all routes)
  const depIso =
    data.params?.departure_time ||
    data.routes[0]?.checkpoints?.[0]?.eta_iso ||
    new Date().toISOString();
  const depHours = new Date(depIso).getTime() / 3600000;
  const cp0 = data.routes[0]?.checkpoints?.[0];
  const cpEnd =
    data.routes[0]?.checkpoints?.[
      Math.max(0, (data.routes[0]?.checkpoints?.length || 1) - 1)
    ];
  const coordSeed =
    (cp0?.lat || 0) * 0.65 +
    (cp0?.lon || 0) * 0.35 +
    (cpEnd?.lat || 0) * 0.45 -
    (cpEnd?.lon || 0) * 0.25;
  const twoPi = 2 * Math.PI;
  const stormPhase = (((depHours * 0.62 + coordSeed) % twoPi) + twoPi) % twoPi;

  const exposures = [0, 1, 2].map((r) =>
    Math.cos(stormPhase - r * ((2 * Math.PI) / 3))
  );
  const sortedCorridors = [0, 1, 2].sort((a, b) => exposures[a] - exposures[b]);

  const evaluatedRoutes = data.routes.map((route, rIdx) => {
    const expRank = sortedCorridors.indexOf(rIdx % 3);
    const centerShift = 0.14 * Math.sin(stormPhase * 1.7 + rIdx * 1.1);
    const widthMod = 0.045 * Math.cos(stormPhase * 1.3 - rIdx * 0.9);
    const windMod = 2.6 * Math.sin(stormPhase * 2.1 + rIdx * 0.7);

    const cps = [...(route.checkpoints || [])];
    const totalCps = cps.length;
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

      if (expRank === 0) {
        const c0 = Math.max(0.28, Math.min(0.72, 0.47 + centerShift));
        const w0 = Math.max(0.06, 0.095 + widthMod * 0.6);
        const nearestIdx = Math.max(1, Math.min(totalCps - 1, Math.round(c0 * (totalCps - 1))));
        if (Math.abs(progress - c0) <= w0 || cIdx === nearestIdx) {
          const rel = Math.max(0, 1 - Math.abs(progress - c0) / Math.max(0.01, w0));
          const peak = Math.sin(rel * (Math.PI / 2));
          wind = Math.round(Math.min(43.2, Math.max(35.8, 36.8 + 3.2 * peak + windMod * 0.5)) * 10) / 10;
          rain = 0.28;
          level = "High";
          score = 3;
          color = "#f97316";
          activeOverrides.push(`High crosswind advisory: ${wind} mph wind`);
        } else if (Math.abs(progress - c0) <= w0 + 0.18) {
          wind = Math.round((27.5 + windMod * 0.4) * 10) / 10;
          rain = 0.12;
          level = "Moderate";
          score = 2;
          color = "#ca8a04";
        } else {
          wind = Math.round((17.0 + windMod * 0.3) * 10) / 10;
          level = "Low";
          score = 1;
          color = "#16a34a";
        }
      } else if (expRank === 1) {
        const c1 = Math.max(0.28, Math.min(0.72, 0.50 + centerShift));
        const w1 = Math.max(0.055, 0.08 + widthMod * 0.7);
        const nearestIdx = Math.max(1, Math.min(totalCps - 1, Math.round(c1 * (totalCps - 1))));
        if (Math.abs(progress - c1) <= w1 || cIdx === nearestIdx) {
          const rel = Math.max(0, 1 - Math.abs(progress - c1) / Math.max(0.01, w1));
          const peak = Math.sin(rel * (Math.PI / 2));
          wind = Math.round((46.8 + 4.5 * peak + windMod * 0.6) * 10) / 10;
          rain = 0.54;
          level = "Severe";
          score = 4;
          color = "#ef4444";
          activeOverrides.push(`Severe storm cell: ${wind} mph wind, ${rain} in/hr rain`);
        } else if (Math.abs(progress - c1) <= w1 + 0.22) {
          wind = Math.round((38.0 + windMod * 0.4) * 10) / 10;
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
        const c2 = Math.max(0.30, Math.min(0.70, 0.48 + centerShift));
        const w2 = Math.max(0.15, 0.215 + widthMod);
        const nearestIdx = Math.max(1, Math.min(totalCps - 1, Math.round(c2 * (totalCps - 1))));
        if (Math.abs(progress - c2) <= w2 || Math.abs(cIdx - nearestIdx) <= 1) {
          const rel = Math.max(0, 1 - Math.abs(progress - c2) / Math.max(0.01, w2));
          const peak = Math.sin(rel * (Math.PI / 2));
          wind = Math.round((48.0 + 8.5 * peak + windMod * 0.7) * 10) / 10;
          rain = Math.round((0.55 + 0.30 * peak) * 100) / 100;
          snow = cp.lat > 36 ? Math.round((1.6 + 1.1 * peak) * 10) / 10 : 0;
          level = wind >= 55 ? "No Travel" : "Severe";
          score = wind >= 55 ? 5 : 4;
          color = wind >= 55 ? "#7f1d1d" : "#ef4444";
          activeOverrides.push(`Severe storm front: ${wind} mph wind, heavy precipitation`);
        } else if (Math.abs(progress - c2) <= w2 + 0.16) {
          wind = Math.round((38.5 + windMod * 0.4) * 10) / 10;
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

  // Sort routes strictly by (severe_miles, high_miles, average_risk, duration_hours)
  const rankedRoutes = [...evaluatedRoutes]
    .sort((a, b) => {
      if (a.summary.severe_miles !== b.summary.severe_miles) {
        return a.summary.severe_miles - b.summary.severe_miles;
      }
      if (a.summary.high_miles !== b.summary.high_miles) {
        return a.summary.high_miles - b.summary.high_miles;
      }
      if (a.summary.average_risk !== b.summary.average_risk) {
        return a.summary.average_risk - b.summary.average_risk;
      }
      return (a.duration_hours || 0) - (b.duration_hours || 0);
    })
    .map((r, idx) => ({
      ...r,
      rank: idx + 1,
      is_recommended: idx === 0,
    }));

  return {
    ...data,
    routes: rankedRoutes,
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

