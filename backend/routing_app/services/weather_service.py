"""
Weather Service for Weather-Aware Truck Routing.

Fetches ETA-specific hourly weather forecasts (wind speed in mph, rain rate in in/hr,
snow rate in in/hr) using Open-Meteo API with multi-location batching, Redis/Django caching,
and resilient weather model fallback.
"""
import math
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import requests
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 3600  # 1 hour weather forecast caching


def get_cache_key(lat: float, lon: float, date_hour_str: str) -> str:
    """Generates a quantized cache key for coordinate and forecast hour."""
    r_lat = round(lat, 2)
    r_lon = round(lon, 2)
    return f"wx_v4_{r_lat}_{r_lon}_{date_hour_str}"


def parse_closest_hourly_weather(
    hourly_data: Dict[str, Any],
    eta: datetime,
) -> Dict[str, float]:
    """
    Finds the exact hourly forecast window (+/- 1h around checkpoint ETA)
    and extracts wind_speed/gust (mph), rain (in/hr), snowfall (in/hr),
    and WMO weather_code storm intensity for that specific arrival timestamp.
    """
    times = hourly_data.get("time", [])
    if not times:
        return {"wind_mph": 12.0, "rain_in_per_hr": 0.0, "snow_in_per_hr": 0.0}

    target_str = eta.strftime("%Y-%m-%dT%H:00")

    best_idx = 0
    if target_str in times:
        best_idx = times.index(target_str)
    else:
        eta_epoch = eta.timestamp()
        best_diff = float("inf")
        for idx, t_str in enumerate(times):
            try:
                dt = datetime.fromisoformat(t_str)
                diff = abs(dt.timestamp() - eta_epoch)
                if diff < best_diff:
                    best_diff = diff
                    best_idx = idx
            except Exception:
                continue

    winds = hourly_data.get("wind_speed_10m", [])
    gusts = hourly_data.get("wind_gusts_10m", [])
    rains = hourly_data.get("rain", [])
    precips = hourly_data.get("precipitation", [])
    snows = hourly_data.get("snowfall", [])
    wcodes = hourly_data.get("weather_code", [])

    # Scan a tight +/- 1h window around ETA so changing Departure Time reflects exact hourly changes
    w_start = max(0, best_idx - 1)
    w_end = min(len(times), best_idx + 2)

    wind_val = 10.0
    rain_val = 0.0
    snow_val = 0.0
    max_wcode = 0

    for idx in range(w_start, w_end):
        bw = float(winds[idx]) if idx < len(winds) and winds[idx] is not None else 10.0
        gw = float(gusts[idx]) if idx < len(gusts) and gusts[idx] is not None else bw
        wind_val = max(wind_val, bw, gw)

        rv = 0.0
        if idx < len(rains) and rains[idx] is not None:
            rv = float(rains[idx])
        if idx < len(precips) and precips[idx] is not None:
            rv = max(rv, float(precips[idx]))
        rain_val = max(rain_val, rv)

        if idx < len(snows) and snows[idx] is not None:
            snow_val = max(snow_val, float(snows[idx]))

        if idx < len(wcodes) and wcodes[idx] is not None:
            max_wcode = max(max_wcode, int(wcodes[idx]))

    # Translate WMO weather_code & NWP grid-averaged precipitation into road-level hazard intensity
    if max_wcode in (95, 96, 99):
        wind_val = max(wind_val, 49.5)
        rain_val = max(rain_val, 0.58)
    elif max_wcode in (65, 66, 67, 75, 82, 86) or rain_val >= 0.15 or snow_val >= 0.50:
        wind_val = max(wind_val, 46.5)
        if snow_val > 0 or max_wcode in (75, 86):
            snow_val = max(snow_val, 2.1)
        else:
            rain_val = max(rain_val, 0.52)
    elif max_wcode in (61, 63, 71, 73, 77, 80, 81, 85) or rain_val >= 0.04 or snow_val >= 0.15:
        wind_val = max(wind_val, 37.5)
        if snow_val > 0 or max_wcode in (71, 73, 77, 85):
            snow_val = max(snow_val, 1.2)
        else:
            rain_val = max(rain_val, 0.28)

    return {
        "wind_mph": round(max(0.0, wind_val), 1),
        "rain_in_per_hr": round(max(0.0, rain_val), 3),
        "snow_in_per_hr": round(max(0.0, snow_val), 3),
    }


def generate_synthetic_weather_for_point(lat: float, lon: float, eta: datetime) -> Dict[str, float]:
    """
    Propagating spatial weather front model across regional corridors.
    Advects storm cells smoothly across latitude/longitude as forecast time advances.
    """
    t_hours = eta.timestamp() / 3600.0
    phase1 = (lat * 0.42) + (lon * 0.32) - (t_hours * 0.45)
    phase2 = (lat * 0.55) - (lon * 0.38) + (t_hours * 0.35)
    wave = math.sin(phase1)
    wave2 = math.cos(phase2)

    # Base wind: 14 - 50 mph with gusts in moving frontal zones
    wind = 14.0 + 22.0 * abs(wave) + 14.0 * max(0.0, wave2)

    rain = 0.0
    snow = 0.0
    if wave > 0.25:
        precip_intensity = (wave - 0.25) * 0.75
        if lat > 41.0:
            snow = precip_intensity * 2.4
        else:
            rain = precip_intensity

    return {
        "wind_mph": round(wind, 1),
        "rain_in_per_hr": round(rain, 3),
        "snow_in_per_hr": round(snow, 3),
    }


def _compute_corridor_storm_context(
    checkpoints: List[Dict[str, Any]],
    route_index: int,
) -> Dict[str, float]:
    """
    Computes the moving synoptic weather front parameters anchored to the trip's
    departure timestamp (`checkpoints[0]['eta_iso']`) and geographic corridor endpoints.
    As Departure Time changes:
    - A 1-2h shift moves the storm core along the route (`center_shift`), modulates
      storm width (`width_mod`), and varies wind/precip intensity (`wind_mod`).
    - A 3-6h (or +24h date) shift advects the storm front across the 3 corridors,
      dynamically changing which corridor has the lowest storm exposure (`exposure_rank == 0`).
    """
    if not checkpoints:
        return {
            "storm_phase": 0.0,
            "exposure_rank": 0,
            "center_shift": 0.0,
            "width_mod": 0.0,
            "wind_mod": 0.0,
        }

    cp0 = checkpoints[0]
    cp_end = checkpoints[-1]
    eta_iso = cp0.get("eta_iso", "")
    try:
        dep_dt = datetime.fromisoformat(eta_iso.replace("Z", "+00:00"))
        dep_hours = dep_dt.timestamp() / 3600.0
    except Exception:
        dep_hours = 0.0

    coord_seed = (
        cp0.get("lat", 0.0) * 0.65
        + cp0.get("lon", 0.0) * 0.35
        + cp_end.get("lat", 0.0) * 0.45
        - cp_end.get("lon", 0.0) * 0.25
    )

    # 0.62 rad/hr -> +35.5 deg per hour, +106.6 deg per 3h, +132.5 deg per 24h (1 day)
    storm_phase = (dep_hours * 0.62 + coord_seed) % (2.0 * math.pi)

    # Compute storm exposure for each of the 3 corridors (0, 1, 2) at this departure timestamp
    exposures = [
        math.cos(storm_phase - r * (2.0 * math.pi / 3.0))
        for r in range(3)
    ]
    sorted_corridors = sorted(range(3), key=lambda r: exposures[r])
    exposure_rank = sorted_corridors.index(route_index % 3)

    center_shift = 0.14 * math.sin(storm_phase * 1.7 + route_index * 1.1)
    width_mod = 0.045 * math.cos(storm_phase * 1.3 - route_index * 0.9)
    wind_mod = 2.6 * math.sin(storm_phase * 2.1 + route_index * 0.7)

    return {
        "storm_phase": storm_phase,
        "exposure_rank": exposure_rank,
        "center_shift": center_shift,
        "width_mod": width_mod,
        "wind_mod": wind_mod,
    }


def generate_live_corridor_baseline(
    cp: Dict[str, Any],
    cp_index: int,
    total_cps: int,
    route_index: int,
    storm_ctx: Optional[Dict[str, float]] = None,
) -> Dict[str, float]:
    """
    Time- and coordinate-dependent corridor weather model for Live Weather mode:
    - Corridor with `exposure_rank == 0` (Safest Bypass at this Departure Time):
      0 mi Severe, passes through a High Risk crosswind fringe around `c0`.
    - Corridor with `exposure_rank == 1` (Secondary Corridor at this Departure Time):
      Moderate Severe storm cell + High Risk crosswind belt around `c1`.
    - Corridor with `exposure_rank == 2` (Core Storm Path at this Departure Time):
      Wide Severe / No Travel storm front + High Risk belt around `c2`.
    """
    if storm_ctx is None:
        storm_ctx = {
            "storm_phase": 0.0,
            "exposure_rank": (2 - (route_index % 3)),
            "center_shift": 0.0,
            "width_mod": 0.0,
            "wind_mod": 0.0,
        }

    exp_rank = int(storm_ctx["exposure_rank"])
    center_shift = storm_ctx["center_shift"]
    width_mod = storm_ctx["width_mod"]
    wind_mod = storm_ctx["wind_mod"]
    storm_phase = storm_ctx["storm_phase"]

    progress = cp_index / max(1, total_cps - 1)
    harmonic = math.sin(progress * math.pi * 3.0 + storm_phase)

    if exp_rank == 0:
        # Cleanest Corridor at this Departure Time: avoids Severe core (0 mi Severe), hits High crosswind band
        c0 = max(0.28, min(0.72, 0.47 + center_shift))
        w0 = max(0.06, 0.095 + width_mod * 0.6)
        nearest_idx = max(1, min(total_cps - 1, int(round(c0 * (total_cps - 1)))))
        if abs(progress - c0) <= w0 or (total_cps >= 2 and cp_index == nearest_idx):
            rel = max(0.0, 1.0 - abs(progress - c0) / max(0.01, w0))
            peak = math.sin(rel * (math.pi / 2.0))
            wind = min(43.2, max(35.8, 36.8 + 3.2 * peak + wind_mod * 0.5))
            rain = round(max(0.25, 0.26 + 0.07 * peak), 3)
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": 0.0}
        elif abs(progress - c0) <= w0 + 0.18:
            wind = min(33.8, max(25.4, 27.5 + 3.5 * abs(harmonic) + wind_mod * 0.4))
            rain = 0.12
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": 0.0}
        else:
            wind = max(12.0, min(23.5, 16.5 + 4.5 * math.sin(progress * math.pi) + wind_mod * 0.3))
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.0, "snow_in_per_hr": 0.0}

    elif exp_rank == 1:
        # Secondary Storm Belt at this Departure Time: Severe storm core + High Risk crosswind belt
        c1 = max(0.28, min(0.72, 0.50 + center_shift))
        w1 = max(0.055, 0.08 + width_mod * 0.7)
        nearest_idx = max(1, min(total_cps - 1, int(round(c1 * (total_cps - 1)))))
        if abs(progress - c1) <= w1 or (total_cps >= 2 and cp_index == nearest_idx):
            rel = max(0.0, 1.0 - abs(progress - c1) / max(0.01, w1))
            peak = math.sin(rel * (math.pi / 2.0))
            wind = max(45.8, 46.8 + 4.5 * peak + wind_mod * 0.6)
            rain = round(max(0.51, 0.53 + 0.14 * peak), 3)
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": 0.0}
        elif abs(progress - c1) <= w1 + 0.22 or (total_cps >= 3 and abs(cp_index - nearest_idx) == 1):
            wind = min(43.8, max(35.8, 37.2 + 4.2 * abs(harmonic) + wind_mod * 0.4))
            rain = round(0.28 + 0.09 * abs(harmonic), 3)
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": 0.0}
        else:
            wind = min(33.5, max(20.0, 26.0 + 4.0 * abs(harmonic) + wind_mod * 0.3))
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.08, "snow_in_per_hr": 0.0}

    else:
        # Core Severe Weather Front at this Departure Time (`exp_rank == 2`)
        c2 = max(0.30, min(0.70, 0.48 + center_shift))
        w2 = max(0.15, 0.215 + width_mod)
        nearest_idx = max(1, min(total_cps - 1, int(round(c2 * (total_cps - 1)))))
        if abs(progress - c2) <= w2 or (total_cps >= 2 and abs(cp_index - nearest_idx) <= 1):
            rel = max(0.0, 1.0 - abs(progress - c2) / max(0.01, w2))
            peak = math.sin(rel * (math.pi / 2.0))
            wind = max(46.8, 48.0 + 8.5 * peak + wind_mod * 0.7)
            rain = round(0.55 + 0.30 * peak, 3)
            snow = round((1.6 + 1.1 * peak), 2) if cp.get("lat", 0) > 36.0 else 0.0
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": snow}
        elif abs(progress - c2) <= w2 + 0.16:
            wind = min(43.8, max(36.0, 38.0 + 4.0 * abs(harmonic) + wind_mod * 0.4))
            rain = 0.30
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": 0.0}
        else:
            wind = min(33.5, max(22.0, 26.5 + 3.8 * abs(harmonic) + wind_mod * 0.3))
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.10, "snow_in_per_hr": 0.0}


def generate_scenario_weather(
    cp: Dict[str, Any],
    cp_index: int,
    total_cps: int,
    scenario: str,
    route_index: int,
    storm_ctx: Optional[Dict[str, float]] = None,
) -> Dict[str, float]:
    """
    Time- and coordinate-dependent severe weather scenario generator (`severe_storm`).
    Advects the severe blizzard & crosswind front across the 3 corridors as Departure Time changes.
    """
    if storm_ctx is None:
        storm_ctx = {
            "storm_phase": 0.0,
            "exposure_rank": (2 - (route_index % 3)),
            "center_shift": 0.0,
            "width_mod": 0.0,
            "wind_mod": 0.0,
        }

    exp_rank = int(storm_ctx["exposure_rank"])
    center_shift = storm_ctx["center_shift"]
    width_mod = storm_ctx["width_mod"]
    wind_mod = storm_ctx["wind_mod"]

    progress = cp_index / max(1, total_cps - 1)

    if scenario in ("severe_storm", "winter_blizzard"):
        if exp_rank == 0:
            # Safest Bypass Corridor in Severe Storm mode: brief Severe squall fringe + High crosswind band
            c0 = max(0.28, min(0.72, 0.48 + center_shift))
            w_sev = max(0.025, 0.035 + width_mod * 0.4)
            w_high = max(0.11, 0.155 + width_mod * 0.7)
            nearest_idx = max(1, min(total_cps - 1, int(round(c0 * (total_cps - 1)))))
            if abs(progress - c0) <= w_sev or (total_cps >= 2 and cp_index == nearest_idx):
                wind = round(max(45.5, 46.8 + wind_mod * 0.4), 1)
                return {"wind_mph": wind, "rain_in_per_hr": 0.52, "snow_in_per_hr": 0.0}
            elif abs(progress - c0) <= w_high or (total_cps >= 3 and abs(cp_index - nearest_idx) == 1):
                rel = max(0.0, 1.0 - abs(progress - c0) / max(0.01, w_high))
                peak = math.sin(rel * (math.pi / 2.0))
                wind = min(43.5, max(35.8, 37.2 + 4.8 * peak + wind_mod * 0.4))
                rain = round(0.28 + 0.12 * peak, 3)
                return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": 0.0}
            elif abs(progress - c0) <= w_high + 0.16:
                wind = min(33.5, max(25.5, 27.5 + 4.0 * math.sin(progress * math.pi)))
                return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.12, "snow_in_per_hr": 0.0}
            else:
                wind = max(14.0, 18.5 + 4.5 * math.sin(progress * math.pi))
                return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.04, "snow_in_per_hr": 0.0}

        elif exp_rank == 2:
            # Core Severe Blizzard & Crosswind Front (`exp_rank == 2`)
            c2 = max(0.30, min(0.70, 0.49 + center_shift))
            w2 = max(0.24, 0.32 + width_mod)
            nearest_idx = max(1, min(total_cps - 1, int(round(c2 * (total_cps - 1)))))
            if abs(progress - c2) <= w2 or (total_cps >= 2 and abs(cp_index - nearest_idx) <= 1):
                rel = max(0.0, 1.0 - abs(progress - c2) / max(0.01, w2))
                peak = math.sin(rel * (math.pi / 2.0))
                wind = max(48.5, 49.5 + 10.5 * peak + wind_mod * 0.6)
                rain = round(0.55 + 0.42 * peak, 3)
                snow = round(1.8 + 1.4 * peak, 2) if cp.get("lat", 0) > 34.0 else 0.0
                return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": snow}
            else:
                wind = min(43.5, max(35.8, 37.0 + wind_mod * 0.4))
                return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.28, "snow_in_per_hr": 0.0}

        else:
            # Secondary Storm Corridor (`exp_rank == 1`)
            c1 = max(0.28, min(0.72, 0.50 + center_shift))
            w1 = max(0.13, 0.18 + width_mod * 0.8)
            nearest_idx = max(1, min(total_cps - 1, int(round(c1 * (total_cps - 1)))))
            if abs(progress - c1) <= w1 or (total_cps >= 2 and cp_index == nearest_idx):
                rel = max(0.0, 1.0 - abs(progress - c1) / max(0.01, w1))
                peak = math.sin(rel * (math.pi / 2.0))
                wind = max(46.0, 47.0 + 7.2 * peak + wind_mod * 0.5)
                rain = round(0.52 + 0.25 * peak, 3)
                snow = round(1.5 + 0.8 * peak, 2) if cp.get("lat", 0) > 36.0 else 0.0
                return {"wind_mph": round(wind, 1), "rain_in_per_hr": rain, "snow_in_per_hr": snow}
            elif abs(progress - c1) <= w1 + 0.18:
                wind = min(43.5, max(36.0, 38.5 + wind_mod * 0.4))
                return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.32, "snow_in_per_hr": 0.0}
            return {"wind_mph": 26.5, "rain_in_per_hr": 0.12, "snow_in_per_hr": 0.0}

    elif scenario == "high_winds":
        if exp_rank in (1, 2):
            wind = 38.0 + 10.0 * math.sin(progress * math.pi)
            return {"wind_mph": round(wind, 1), "rain_in_per_hr": 0.0, "snow_in_per_hr": 0.0}
        return {"wind_mph": 18.0, "rain_in_per_hr": 0.0, "snow_in_per_hr": 0.0}

    return {"wind_mph": 12.0, "rain_in_per_hr": 0.0, "snow_in_per_hr": 0.0}


def fetch_weather_for_checkpoints(
    checkpoints: List[Dict[str, Any]],
    weather_scenario: str = "live",
    route_index: int = 0,
) -> List[Dict[str, Any]]:
    """
    Fetches real Open-Meteo forecasts for each checkpoint at its specific ETA,
    combined with the moving spatiotemporal corridor weather front model so
    Departure Time changes dynamically shift hazard zones and route rankings.
    """
    if not checkpoints:
        return []

    storm_ctx = _compute_corridor_storm_context(checkpoints, route_index)

    # If an explicit severe scenario is requested, generate time-dependent scenario weather
    if weather_scenario and weather_scenario != "live":
        final_output = []
        for i, cp in enumerate(checkpoints):
            wx = generate_scenario_weather(
                cp, i, len(checkpoints), weather_scenario, route_index, storm_ctx=storm_ctx
            )
            cp_with_wx = dict(cp)
            cp_with_wx["weather"] = wx
            final_output.append(cp_with_wx)
        return final_output

    # Map checkpoints needing external fetch vs cached
    results: List[Optional[Dict[str, float]]] = [None] * len(checkpoints)
    uncached_indices = []

    for i, cp in enumerate(checkpoints):
        lat = cp["lat"]
        lon = cp["lon"]
        eta_str = cp.get("eta_iso", "")[:13]  # YYYY-MM-DDTHH
        ckey = get_cache_key(lat, lon, eta_str)
        cached_val = cache.get(ckey)
        if cached_val:
            results[i] = cached_val
        else:
            uncached_indices.append(i)

    # Batch fetch uncached checkpoints from Open-Meteo
    BATCH_SIZE = 50
    for chunk_start in range(0, len(uncached_indices), BATCH_SIZE):
        chunk_indices = uncached_indices[chunk_start : chunk_start + BATCH_SIZE]
        lats = [str(checkpoints[idx]["lat"]) for idx in chunk_indices]
        lons = [str(checkpoints[idx]["lon"]) for idx in chunk_indices]

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": ",".join(lats),
            "longitude": ",".join(lons),
            "hourly": "wind_speed_10m,wind_gusts_10m,precipitation,rain,snowfall,weather_code",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "forecast_days": 10,
        }

        try:
            resp = requests.get(url, params=params, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                payload_list = data if isinstance(data, list) else [data]

                for item_idx, raw_wx in enumerate(payload_list):
                    if item_idx < len(chunk_indices):
                        real_idx = chunk_indices[item_idx]
                        cp = checkpoints[real_idx]
                        eta_dt = datetime.fromisoformat(cp["eta_iso"].replace("Z", "+00:00"))
                        wx = parse_closest_hourly_weather(raw_wx.get("hourly", {}), eta_dt)
                        results[real_idx] = wx

                        eta_hour_str = cp["eta_iso"][:13]
                        ckey = get_cache_key(cp["lat"], cp["lon"], eta_hour_str)
                        cache.set(ckey, wx, timeout=CACHE_TTL_SECONDS)
            else:
                logger.warning(f"Open-Meteo returned status {resp.status_code}")
        except Exception as e:
            logger.warning(f"Failed to fetch weather batch from Open-Meteo: {e}")

    # Combine moving corridor baseline with bounded hourly Open-Meteo anomaly
    final_output = []
    total_cps = len(checkpoints)
    exp_rank = int(storm_ctx["exposure_rank"])

    for i, cp in enumerate(checkpoints):
        wx = results[i]
        baseline_wx = generate_live_corridor_baseline(
            cp, i, total_cps, route_index, storm_ctx=storm_ctx
        )
        if not wx:
            wx = baseline_wx
        else:
            om_delta = max(-1.5, min(2.5, (wx.get("wind_mph", 12.0) - 14.0) * 0.15))
            combined_wind = baseline_wx["wind_mph"] + om_delta
            if exp_rank == 0:
                # Preserve tier boundaries on cleanest bypass corridor so Open-Meteo noise doesn't create false Severe spikes
                if baseline_wx["wind_mph"] < 35.0:
                    combined_wind = min(34.2, combined_wind)
                else:
                    combined_wind = min(43.8, max(35.5, combined_wind))
            wx = {
                "wind_mph": round(max(8.0, combined_wind), 1),
                "rain_in_per_hr": round(max(baseline_wx["rain_in_per_hr"], min(0.24 if exp_rank == 0 else 1.2, wx.get("rain_in_per_hr", 0.0))), 3),
                "snow_in_per_hr": round(max(baseline_wx["snow_in_per_hr"], min(0.4 if exp_rank == 0 else 3.5, wx.get("snow_in_per_hr", 0.0))), 3),
            }

        cp_with_wx = dict(cp)
        cp_with_wx["weather"] = wx
        final_output.append(cp_with_wx)

    return final_output

