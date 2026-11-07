"""
Corridor Heatmap Service for Weather-Aware Truck Routing.

Computes a geographic envelope around active routes and samples weather intensity
grids across 0-48 forecast hours for the interactive slider heatmap layer.
"""
import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
from routing_app.services.weather_service import (
    generate_synthetic_weather_for_point,
    get_cache_key,
)
from routing_app.services.risk_evaluator import (
    classify_wind,
    classify_rain,
    classify_snow,
    NUMERIC_SCORES,
    RiskLevel,
)
from django.core.cache import cache


def generate_corridor_grid(
    routes_coordinates: List[List[List[float]]],
    departure_time: datetime,
    forecast_hour: int = 0,
    grid_step_miles: float = 35.0,
    buffer_miles: float = 40.0,
) -> Dict[str, Any]:
    """
    Creates a sampled grid along the multi-route corridor for a specific forecast hour offset (0 to 48 hr).
    Returns bounding box and heatmap points `[lat, lon, intensity, risk_level, wind_mph, precip]`.
    """
    all_lats = []
    all_lons = []
    for coords in routes_coordinates:
        for lon, lat in coords:
            all_lats.append(lat)
            all_lons.append(lon)

    if not all_lats or not all_lons:
        return {"bounds": [], "points": []}

    min_lat, max_lat = min(all_lats), max(all_lats)
    min_lon, max_lon = min(all_lons), max(all_lons)

    # 1 deg lat is approx 69 miles
    lat_buf = buffer_miles / 69.0
    # Average lat for lon conversion
    mid_lat = (min_lat + max_lat) / 2.0
    lon_buf = buffer_miles / (69.0 * max(0.2, math.cos(math.radians(mid_lat))))

    min_lat -= lat_buf
    max_lat += lat_buf
    min_lon -= lon_buf
    max_lon += lon_buf

    lat_step = grid_step_miles / 69.0
    lon_step = grid_step_miles / (69.0 * max(0.2, math.cos(math.radians(mid_lat))))

    target_time = departure_time + timedelta(hours=forecast_hour)
    target_hour_str = target_time.strftime("%Y-%m-%dT%H:00")

    cache_key = f"corridor_v2_{round(min_lat,1)}_{round(min_lon,1)}_{round(max_lat,1)}_{round(max_lon,1)}_{target_hour_str}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    # Generate grid coordinates
    grid_points = []
    curr_lat = min_lat
    while curr_lat <= max_lat:
        curr_lon = min_lon
        while curr_lon <= max_lon:
            # Check proximity to any route point to keep corridor tight (avoid excessive empty grid space)
            is_near_corridor = False
            for coords in routes_coordinates:
                # Sample a few vertices
                step = max(1, len(coords) // 15)
                for i in range(0, len(coords), step):
                    c_lon, c_lat = coords[i]
                    if abs(c_lat - curr_lat) < lat_buf * 1.5 and abs(c_lon - curr_lon) < lon_buf * 1.5:
                        is_near_corridor = True
                        break
                if is_near_corridor:
                    break

            if is_near_corridor:
                wx = generate_synthetic_weather_for_point(curr_lat, curr_lon, target_time)
                wind = wx["wind_mph"]
                rain = wx["rain_in_per_hr"]
                snow = wx["snow_in_per_hr"]

                w_lvl = classify_wind(wind)
                r_lvl = classify_rain(rain)
                s_lvl = classify_snow(snow)

                max_score = max(NUMERIC_SCORES[w_lvl], NUMERIC_SCORES[r_lvl], NUMERIC_SCORES[s_lvl])
                # Normalize intensity for heatmap: 1.0 (Low) to 5.0 (No Travel) -> scale 0.15 to 1.0
                intensity = round(0.15 + (max_score - 1) * 0.21, 2)

                score_to_lvl = {v: k for k, v in NUMERIC_SCORES.items()}
                risk_lvl = score_to_lvl[max_score]

                grid_points.append({
                    "lat": round(curr_lat, 4),
                    "lon": round(curr_lon, 4),
                    "intensity": intensity,
                    "risk_level": risk_lvl,
                    "wind_mph": wind,
                    "rain_in_per_hr": rain,
                    "snow_in_per_hr": snow,
                })
            curr_lon += lon_step
        curr_lat += lat_step

    result = {
        "forecast_hour": forecast_hour,
        "valid_time_iso": target_time.isoformat(),
        "valid_time_formatted": target_time.strftime("%a %b %d, %I:%M %p"),
        "bounds": [
            [round(min_lat, 4), round(min_lon, 4)],
            [round(max_lat, 4), round(max_lon, 4)],
        ],
        "points": grid_points,
    }

    cache.set(cache_key, result, timeout=1800)
    return result

