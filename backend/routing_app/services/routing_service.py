"""
Routing Service for Weather-Aware Truck Routing.

Handles:
- Geocoding of origin/destination addresses
- Fetching 3 alternative routes (via OpenRouteService, OSRM, or realistic geometric simulation)
- Polyline distance interpolation and checkpoint sampling at exact intervals (10, 25, 50 miles)
- ETA calculation for each checkpoint based on departure time and cumulative duration
"""
import math
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
import requests
from django.conf import settings
from geopy.distance import geodesic

logger = logging.getLogger(__name__)

METERS_TO_MILES = 0.000621371
MILES_TO_METERS = 1609.34


def geocode_address(query: str) -> Optional[Tuple[float, float, str]]:
    """
    Geocodes an address or parses coordinates "lat,lon".
    Returns (lat, lon, display_name).
    """
    if not query or not query.strip():
        return None

    cleaned = query.strip()

    # Check if user entered direct "lat, lon"
    parts = cleaned.split(",")
    if len(parts) == 2:
        try:
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                return lat, lon, f"Coord: {lat:.4f}, {lon:.4f}"
        except ValueError:
            pass

    # Query Nominatim OpenStreetMap
    headers = {"User-Agent": "WeatherAwareTruckRouting/1.0 (truck-weather-app@example.com)"}
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": cleaned, "format": "json", "limit": 1},
            headers=headers,
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                item = data[0]
                lat = float(item["lat"])
                lon = float(item["lon"])
                display_name = item.get("display_name", cleaned)
                return lat, lon, display_name
    except Exception as e:
        logger.warning(f"Nominatim geocoding failed for '{cleaned}': {e}")

    # Fallback dictionary of common transport hubs if network fails or offline
    KNOWN_HUBS = {
        "chicago": (41.8781, -87.6298, "Chicago, IL, USA"),
        "dallas": (32.7767, -96.7970, "Dallas, TX, USA"),
        "denver": (39.7392, -104.9903, "Denver, CO, USA"),
        "atlanta": (33.7490, -84.3880, "Atlanta, GA, USA"),
        "seattle": (47.6062, -122.3321, "Seattle, WA, USA"),
        "los angeles": (34.0522, -118.2437, "Los Angeles, CA, USA"),
        "new york": (40.7128, -74.0060, "New York, NY, USA"),
        "st louis": (38.6270, -90.1994, "St. Louis, MO, USA"),
        "houston": (29.7604, -95.3698, "Houston, TX, USA"),
        "kansas city": (39.0997, -94.5786, "Kansas City, MO, USA"),
        "minneapolis": (44.9778, -93.2650, "Minneapolis, MN, USA"),
        "detroit": (42.3314, -83.0458, "Detroit, MI, USA"),
        "miami": (25.7617, -80.1918, "Miami, FL, USA"),
        "phoenix": (33.4484, -112.0740, "Phoenix, AZ, USA"),
    }
    lowered = cleaned.lower()
    for k, v in KNOWN_HUBS.items():
        if k in lowered:
            return v

    return None


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in miles between two coordinates."""
    r = 3958.8  # Earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def interpolate_polyline_checkpoints(
    coordinates: List[List[float]],
    step_miles: float,
    total_distance_miles: float,
    total_duration_seconds: float,
    departure_time: datetime,
) -> List[Dict[str, Any]]:
    """
    Samples checkpoints along a polyline `[[lon, lat], ...]` strictly at step_miles.
    Includes departure checkpoint at mile 0 and destination checkpoint at the end.
    Calculates ETA timestamp for each checkpoint.
    """
    if not coordinates or len(coordinates) < 2:
        return []

    # Calculate cumulative distance along polyline vertices
    cum_distances = [0.0]
    for i in range(1, len(coordinates)):
        lon1, lat1 = coordinates[i - 1]
        lon2, lat2 = coordinates[i]
        d = haversine_miles(lat1, lon1, lat2, lon2)
        cum_distances.append(cum_distances[-1] + d)

    actual_total_miles = cum_distances[-1]
    if actual_total_miles <= 0.001:
        return []

    # Speeds: average speed in mph
    avg_speed_mph = (
        total_distance_miles / (total_duration_seconds / 3600.0)
        if total_duration_seconds > 0
        else 55.0
    )
    if avg_speed_mph <= 5.0 or avg_speed_mph > 85.0:
        avg_speed_mph = 55.0

    target_distances = []
    current_dist = 0.0
    while current_dist < actual_total_miles - (step_miles * 0.25):
        target_distances.append(current_dist)
        current_dist += step_miles

    # Always ensure the arrival point is sampled
    if not target_distances or (actual_total_miles - target_distances[-1]) > (step_miles * 0.2):
        target_distances.append(actual_total_miles)

    checkpoints: List[Dict[str, Any]] = []
    current_seg_idx = 0

    for idx, target_d in enumerate(target_distances):
        # Find segment in cum_distances containing target_d
        while (
            current_seg_idx < len(cum_distances) - 2
            and cum_distances[current_seg_idx + 1] < target_d
        ):
            current_seg_idx += 1

        seg_start_d = cum_distances[current_seg_idx]
        seg_end_d = cum_distances[current_seg_idx + 1]
        seg_len = seg_end_d - seg_start_d

        if seg_len > 0.00001:
            ratio = (target_d - seg_start_d) / seg_len
            ratio = max(0.0, min(1.0, ratio))
        else:
            ratio = 0.0

        p1_lon, p1_lat = coordinates[current_seg_idx]
        p2_lon, p2_lat = coordinates[current_seg_idx + 1]

        target_lon = p1_lon + ratio * (p2_lon - p1_lon)
        target_lat = p1_lat + ratio * (p2_lat - p1_lat)

        # Fraction of total journey
        journey_fraction = target_d / actual_total_miles
        checkpoint_seconds = journey_fraction * total_duration_seconds
        checkpoint_eta = departure_time + timedelta(seconds=checkpoint_seconds)

        checkpoints.append({
            "index": idx,
            "mile_marker": round(target_d, 1),
            "lat": round(target_lat, 6),
            "lon": round(target_lon, 6),
            "eta_iso": checkpoint_eta.isoformat(),
            "eta_formatted": checkpoint_eta.strftime("%b %d, %I:%M %p"),
            "cumulative_travel_time_hrs": round(checkpoint_seconds / 3600.0, 2),
            "cumulative_seconds": round(checkpoint_seconds, 0),
        })

    return checkpoints


def generate_simulated_alternatives(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    step_miles: float,
    departure_time: datetime,
) -> List[Dict[str, Any]]:
    """
    Generates 3 realistic highway alternative corridors (Direct/Interstate, Northern Corridor, Southern Corridor)
    with curved realistic highway geometry, realistic distances, and speeds.
    """
    direct_dist = haversine_miles(start_lat, start_lon, end_lat, end_lon)
    route_profiles = [
        {"name": "Interstate Primary Route (Fastest)", "detour_factor": 1.15, "curve_offset": 0.0, "speed_mph": 62.0},
        {"name": "Northern Bypass Corridor", "detour_factor": 1.25, "curve_offset": 0.15, "speed_mph": 58.0},
        {"name": "Southern Regional Corridor", "detour_factor": 1.28, "curve_offset": -0.16, "speed_mph": 56.0},
    ]

    routes = []
    # Vector perpendicular to start-end
    dx = end_lon - start_lon
    dy = end_lat - start_lat
    perp_dx = -dy
    perp_dy = dx

    num_samples = max(40, int(direct_dist / 10))

    for idx, prof in enumerate(route_profiles):
        coords: List[List[float]] = []
        offset = prof["curve_offset"]
        dist_factor = prof["detour_factor"]
        speed = prof["speed_mph"]

        for i in range(num_samples + 1):
            t = i / float(num_samples)
            # Smooth sine arch for alternative curvature
            arch = math.sin(math.pi * t)
            # Secondary harmonic for highway twists
            harmonic = 0.2 * math.sin(3 * math.pi * t)
            curr_lat = start_lat + t * dy + (arch + harmonic) * perp_dy * offset
            curr_lon = start_lon + t * dx + (arch + harmonic) * perp_dx * offset
            coords.append([round(curr_lon, 6), round(curr_lat, 6)])

        route_dist = direct_dist * dist_factor
        route_duration = (route_dist / speed) * 3600.0

        checkpoints = interpolate_polyline_checkpoints(
            coordinates=coords,
            step_miles=step_miles,
            total_distance_miles=route_dist,
            total_duration_seconds=route_duration,
            departure_time=departure_time,
        )

        routes.append({
            "id": f"route_option_{idx + 1}",
            "name": prof["name"],
            "summary_title": f"Route {idx + 1}: {prof['name']}",
            "distance_miles": round(route_dist, 1),
            "duration_hours": round(route_duration / 3600.0, 1),
            "duration_seconds": round(route_duration, 0),
            "coordinates": coords,
            "checkpoints": checkpoints,
            "step_miles": step_miles,
        })

    return routes


def fetch_ors_routes(
    api_key: str,
    start_lon: float,
    start_lat: float,
    end_lon: float,
    end_lat: float,
    step_miles: float,
    departure_time: datetime,
) -> Optional[List[Dict[str, Any]]]:
    """
    Queries OpenRouteService API:
    - If distance <= 100km (62 miles), uses ORS native alternative_routes
    - If distance > 100km, queries ORS with 3 distinct corridor trajectories
      (Direct, North/Lateral Bypass, South/Lateral Bypass) to bypass ORS's 100km alternative_routes limit.
    """
    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }

    direct_dist_miles = haversine_miles(start_lat, start_lon, end_lat, end_lon)

    # 1. If short route <= 62 miles, try native ORS alternative_routes
    if direct_dist_miles <= 60.0:
        body = {
            "coordinates": [[start_lon, start_lat], [end_lon, end_lat]],
            "alternative_routes": {
                "target_count": 3,
                "weight_factor": 1.4,
                "share_factor": 0.6,
            },
            "instructions": False,
        }
        try:
            resp = requests.post(url, json=body, headers=headers, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])
                if len(features) >= 1:
                    routes = []
                    for i, feat in enumerate(features):
                        props = feat.get("properties", {}).get("summary", {})
                        dist_meters = props.get("distance", 0.0)
                        dur_seconds = props.get("duration", 0.0)
                        coords = feat.get("geometry", {}).get("coordinates", [])
                        dist_miles = dist_meters * METERS_TO_MILES

                        checkpoints = interpolate_polyline_checkpoints(
                            coordinates=coords,
                            step_miles=step_miles,
                            total_distance_miles=dist_miles,
                            total_duration_seconds=dur_seconds,
                            departure_time=departure_time,
                        )
                        routes.append({
                            "id": f"route_option_{i + 1}",
                            "name": f"ORS Highway Option {i + 1}",
                            "summary_title": f"Route {i + 1} (ORS)",
                            "distance_miles": round(dist_miles, 1),
                            "duration_hours": round(dur_seconds / 3600.0, 1),
                            "duration_seconds": round(dur_seconds, 0),
                            "coordinates": coords,
                            "checkpoints": checkpoints,
                            "step_miles": step_miles,
                        })
                    if len(routes) >= 3:
                        return routes
        except Exception as e:
            logger.warning(f"ORS short route query failed: {e}")

    # 2. For routes > 100km: query 3 distinct corridors via ORS
    dx = end_lon - start_lon
    dy = end_lat - start_lat
    mid_lon = (start_lon + end_lon) / 2.0
    mid_lat = (start_lat + end_lat) / 2.0

    # Perpendicular unit offsets
    perp_dx = -dy
    perp_dy = dx
    norm = math.hypot(perp_dx, perp_dy) or 1.0
    perp_dx /= norm
    perp_dy /= norm

    # Lateral offset proportional to distance (approx 12-15% lateral detour)
    offset_dist = min(3.0, max(0.5, direct_dist_miles * 0.002))

    corridors = [
        {"name": "Interstate Primary Route (ORS)", "coords": [[start_lon, start_lat], [end_lon, end_lat]]},
        {
            "name": "Northern Corridor (ORS)",
            "coords": [
                [start_lon, start_lat],
                [round(mid_lon + perp_dx * offset_dist, 5), round(mid_lat + perp_dy * offset_dist, 5)],
                [end_lon, end_lat],
            ],
        },
        {
            "name": "Southern Corridor (ORS)",
            "coords": [
                [start_lon, start_lat],
                [round(mid_lon - perp_dx * offset_dist, 5), round(mid_lat - perp_dy * offset_dist, 5)],
                [end_lon, end_lat],
            ],
        },
    ]

    routes = []
    for idx, c in enumerate(corridors):
        try:
            resp = requests.post(url, json={"coordinates": c["coords"], "instructions": False}, headers=headers, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                feat = data.get("features", [])[0]
                props = feat.get("properties", {}).get("summary", {})
                dist_meters = props.get("distance", 0.0)
                dur_seconds = props.get("duration", 0.0)
                coords = feat.get("geometry", {}).get("coordinates", [])

                dist_miles = dist_meters * METERS_TO_MILES
                checkpoints = interpolate_polyline_checkpoints(
                    coordinates=coords,
                    step_miles=step_miles,
                    total_distance_miles=dist_miles,
                    total_duration_seconds=dur_seconds,
                    departure_time=departure_time,
                )

                routes.append({
                    "id": f"route_option_{idx + 1}",
                    "name": c["name"],
                    "summary_title": f"Route {idx + 1}: {c['name']}",
                    "distance_miles": round(dist_miles, 1),
                    "duration_hours": round(dur_seconds / 3600.0, 1),
                    "duration_seconds": round(dur_seconds, 0),
                    "coordinates": coords,
                    "checkpoints": checkpoints,
                    "step_miles": step_miles,
                })
        except Exception as e:
            logger.warning(f"ORS corridor {idx + 1} query failed: {e}")

    if len(routes) == 3:
        return routes
    return None


def fetch_osrm_routes(
    start_lon: float,
    start_lat: float,
    end_lon: float,
    end_lat: float,
    step_miles: float,
    departure_time: datetime,
) -> Optional[List[Dict[str, Any]]]:
    """Queries public OSRM for driving routes with alternatives=true."""
    url = f"https://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson&alternatives=3"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            raw_routes = data.get("routes", [])
            if not raw_routes:
                return None

            routes = []
            for i, r in enumerate(raw_routes):
                dist_meters = r.get("distance", 0.0)
                dur_seconds = r.get("duration", 0.0)
                coords = r.get("geometry", {}).get("coordinates", [])

                dist_miles = dist_meters * METERS_TO_MILES
                checkpoints = interpolate_polyline_checkpoints(
                    coordinates=coords,
                    step_miles=step_miles,
                    total_distance_miles=dist_miles,
                    total_duration_seconds=dur_seconds,
                    departure_time=departure_time,
                )

                routes.append({
                    "id": f"route_option_{i + 1}",
                    "name": f"OSRM Highway Route {i + 1}",
                    "summary_title": f"Route {i + 1} (OSRM)",
                    "distance_miles": round(dist_miles, 1),
                    "duration_hours": round(dur_seconds / 3600.0, 1),
                    "duration_seconds": round(dur_seconds, 0),
                    "coordinates": coords,
                    "checkpoints": checkpoints,
                    "step_miles": step_miles,
                })

            # If OSRM returned fewer than 3 alternatives, supplement with synthesized highway alternatives
            if len(routes) < 3:
                simulated = generate_simulated_alternatives(
                    start_lat, start_lon, end_lat, end_lon, step_miles, departure_time
                )
                for sim in simulated:
                    if len(routes) >= 3:
                        break
                    sim["id"] = f"route_option_{len(routes) + 1}"
                    sim["summary_title"] = f"Route {len(routes) + 1} ({sim['name']})"
                    routes.append(sim)

            return routes[:3]
    except Exception as e:
        logger.warning(f"OSRM routing failed: {e}")

    return None


def get_three_alternative_routes(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    step_miles: float,
    departure_time: datetime,
    ors_api_key: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Orchestrates fetching 3 distinct alternative routes:
    1. Try ORS if api_key provided or in settings
    2. Try OSRM
    3. Fallback to realistic simulated interstate corridors
    """
    key = ors_api_key or getattr(settings, "ORS_API_KEY", "")
    if key and key.strip():
        try:
            routes = fetch_ors_routes(key, start_lon, start_lat, end_lon, end_lat, step_miles, departure_time)
            if routes and len(routes) >= 3:
                return routes
        except Exception as e:
            logger.warning(f"OpenRouteService failed: {e}")

    try:
        routes = fetch_osrm_routes(start_lon, start_lat, end_lon, end_lat, step_miles, departure_time)
        if routes and len(routes) >= 3:
            return routes
    except Exception as e:
        logger.warning(f"OSRM failed: {e}")

    # Fallback to high precision simulated highway corridors
    return generate_simulated_alternatives(start_lat, start_lon, end_lat, end_lon, step_miles, departure_time)

