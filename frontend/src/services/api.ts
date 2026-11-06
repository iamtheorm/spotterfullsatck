import { EvaluationResponse, RouteEvaluationRequest, CorridorData } from "../types";

// In development, target Django directly at http://localhost:8000/api with CORS enabled
// In production, fallback to relative path /api
const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000/api"
    : "/api");

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

  return resp.json();
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

export async function healthCheck(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/health/`);
    return resp.ok;
  } catch {
    return false;
  }
}

