export type RiskLevel = "Low" | "Moderate" | "High" | "Severe" | "No Travel";

export interface WeatherCondition {
  value_mph?: number;
  value_in_per_hr?: number;
  level: RiskLevel;
  score: number;
}

export interface CheckpointWeather {
  wind_mph: number;
  rain_in_per_hr: number;
  snow_in_per_hr: number;
}

export interface Checkpoint {
  index: number;
  mile_marker: number;
  lat: number;
  lon: number;
  eta_iso: string;
  eta_formatted: string;
  cumulative_travel_time_hrs: number;
  cumulative_seconds: number;
  weather: CheckpointWeather;
  final_level: RiskLevel;
  final_score: number;
  color: string;
  conditions: {
    wind: { value_mph: number; level: RiskLevel; score: number };
    rain: { value_in_per_hr: number; level: RiskLevel; score: number };
    snow: { value_in_per_hr: number; level: RiskLevel; score: number };
  };
  load_weight_lbs: number;
  active_overrides: string[];
}

export interface RouteSummary {
  severe_miles: number;
  high_miles: number;
  no_travel_miles: number;
  moderate_miles: number;
  low_miles: number;
  average_risk: number;
  max_risk_level: RiskLevel;
  has_no_travel: boolean;
  total_distance_miles: number;
  total_duration_seconds: number;
}

export interface RouteOption {
  id: string;
  name: string;
  summary_title: string;
  distance_miles: number;
  duration_hours: number;
  duration_seconds: number;
  rank: number;
  is_recommended: boolean;
  coordinates: [number, number][]; // [lon, lat]
  checkpoints: Checkpoint[];
  summary: RouteSummary;
  step_miles: number;
}

export interface CorridorPoint {
  lat: number;
  lon: number;
  intensity: number;
  risk_level: RiskLevel;
  wind_mph: number;
  rain_in_per_hr: number;
  snow_in_per_hr: number;
}

export interface CorridorData {
  forecast_hour: number;
  valid_time_iso: string;
  valid_time_formatted: string;
  bounds: [[number, number], [number, number]];
  points: CorridorPoint[];
}

export interface EvaluationResponse {
  status: string;
  evaluated_at: string;
  origin: {
    name: string;
    lat: number;
    lon: number;
  };
  destination: {
    name: string;
    lat: number;
    lon: number;
  };
  params: {
    departure_time: string;
    load_weight_lbs: number;
    step_miles: number;
  };
  routes: RouteOption[];
  corridor: CorridorData;
}

export interface RouteEvaluationRequest {
  origin: string;
  destination: string;
  departure_time: string;
  load_weight: number;
  step_miles: number;
  ors_api_key?: string;
}

