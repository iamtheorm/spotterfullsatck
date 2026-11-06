"""
Risk Assessment and Load Rules Engine for Weather-Aware Truck Routing.

Evaluates wind, rain, snow conditions according to strict threshold rules
and applies vehicle/load weight overrides to compute checkpoint risk and
aggregate route metrics.
"""
from typing import Dict, Any, List, Tuple


class RiskLevel:
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    SEVERE = "Severe"
    NO_TRAVEL = "No Travel"


NUMERIC_SCORES = {
    RiskLevel.LOW: 1,
    RiskLevel.MODERATE: 2,
    RiskLevel.HIGH: 3,
    RiskLevel.SEVERE: 4,
    RiskLevel.NO_TRAVEL: 5,
}

COLOR_CODES = {
    RiskLevel.LOW: "#22c55e",       # Green
    RiskLevel.MODERATE: "#eab308",  # Yellow
    RiskLevel.HIGH: "#f97316",      # Orange
    RiskLevel.SEVERE: "#ef4444",    # Red
    RiskLevel.NO_TRAVEL: "#1e1e24", # Dark / Black
}


def classify_wind(wind_mph: float) -> str:
    """
    Classify wind speed (mph):
    Low: < 25
    Moderate: 25 - 34
    High: 35 - 44
    Severe: 45 - 54
    No Travel: >= 55
    """
    if wind_mph >= 55.0:
        return RiskLevel.NO_TRAVEL
    if wind_mph >= 45.0:
        return RiskLevel.SEVERE
    if wind_mph >= 35.0:
        return RiskLevel.HIGH
    if wind_mph >= 25.0:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def classify_rain(rain_in_per_hr: float) -> str:
    """
    Classify rain rate (inches / hour):
    Low: < 0.10
    Moderate: 0.10 - 0.25
    High: 0.25 - 0.50
    Severe: 0.50 - 1.00
    No Travel: > 1.00
    """
    if rain_in_per_hr > 1.00:
        return RiskLevel.NO_TRAVEL
    if rain_in_per_hr >= 0.50:
        return RiskLevel.SEVERE
    if rain_in_per_hr >= 0.25:
        return RiskLevel.HIGH
    if rain_in_per_hr >= 0.10:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def classify_snow(snow_in_per_hr: float) -> str:
    """
    Classify snowfall rate (inches / hour):
    Low: < 0.5
    Moderate: 0.5 - 1.0
    High: 1.0 - 2.0
    Severe: 2.0 - 3.0
    No Travel: > 3.0
    """
    if snow_in_per_hr > 3.0:
        return RiskLevel.NO_TRAVEL
    if snow_in_per_hr >= 2.0:
        return RiskLevel.SEVERE
    if snow_in_per_hr >= 1.0:
        return RiskLevel.HIGH
    if snow_in_per_hr >= 0.5:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def evaluate_checkpoint_risk(
    wind_mph: float,
    rain_in_per_hr: float,
    snow_in_per_hr: float,
    load_weight_lbs: float,
) -> Dict[str, Any]:
    """
    Computes base risk levels for each condition, checks load rule overrides,
    and returns comprehensive risk assessment dictionary.
    """
    wind_level = classify_wind(wind_mph)
    rain_level = classify_rain(rain_in_per_hr)
    snow_level = classify_snow(snow_in_per_hr)

    # Base risk is the maximum numeric risk of any single factor
    raw_levels = [wind_level, rain_level, snow_level]
    base_score = max(NUMERIC_SCORES[level] for level in raw_levels)
    score_to_level = {v: k for k, v in NUMERIC_SCORES.items()}
    base_level = score_to_level[base_score]

    final_score = base_score
    active_overrides: List[str] = []

    # Load Overrides:
    # 1. Wind >= 55 mph -> No Travel for any load
    if wind_mph >= 55.0:
        final_score = max(final_score, NUMERIC_SCORES[RiskLevel.NO_TRAVEL])
        active_overrides.append("Wind ≥ 55 mph triggers mandatory No Travel regardless of load")

    # 2. Wind 45-54 mph + Load Weight > 30,000 lb -> No Travel
    if 45.0 <= wind_mph <= 54.0 and load_weight_lbs > 30000.0:
        final_score = max(final_score, NUMERIC_SCORES[RiskLevel.NO_TRAVEL])
        active_overrides.append(
            f"Wind 45-54 mph ({wind_mph:.1f} mph) with load {load_weight_lbs:,.0f} lb (>30,000 lb) elevates risk to No Travel"
        )

    # 3. Wind 35-44 mph + Load Weight > 40,000 lb -> Severe
    if 35.0 <= wind_mph <= 44.0 and load_weight_lbs > 40000.0:
        final_score = max(final_score, NUMERIC_SCORES[RiskLevel.SEVERE])
        active_overrides.append(
            f"Wind 35-44 mph ({wind_mph:.1f} mph) with load {load_weight_lbs:,.0f} lb (>40,000 lb) elevates risk to Severe"
        )

    final_level = score_to_level[final_score]

    return {
        "final_level": final_level,
        "final_score": final_score,
        "color": COLOR_CODES[final_level],
        "conditions": {
            "wind": {
                "value_mph": round(wind_mph, 1),
                "level": wind_level,
                "score": NUMERIC_SCORES[wind_level],
            },
            "rain": {
                "value_in_per_hr": round(rain_in_per_hr, 3),
                "level": rain_level,
                "score": NUMERIC_SCORES[rain_level],
            },
            "snow": {
                "value_in_per_hr": round(snow_in_per_hr, 3),
                "level": snow_level,
                "score": NUMERIC_SCORES[snow_level],
            },
        },
        "load_weight_lbs": load_weight_lbs,
        "active_overrides": active_overrides,
    }


def aggregate_route_metrics(
    checkpoints: List[Dict[str, Any]],
    step_miles: float,
    total_distance_miles: float,
    total_duration_seconds: float,
) -> Dict[str, Any]:
    """
    Calculates route totals:
    - Miles in Severe
    - Miles in High
    - Miles in No Travel
    - Miles in Moderate
    - Miles in Low
    - Average numerical risk
    - Recommendation ranking score
    """
    if not checkpoints:
        return {
            "severe_miles": 0.0,
            "high_miles": 0.0,
            "no_travel_miles": 0.0,
            "moderate_miles": 0.0,
            "low_miles": 0.0,
            "average_risk": 1.0,
            "max_risk_level": RiskLevel.LOW,
            "has_no_travel": False,
            "total_distance_miles": total_distance_miles,
            "total_duration_seconds": total_duration_seconds,
        }

    severe_count = 0
    high_count = 0
    no_travel_count = 0
    moderate_count = 0
    low_count = 0
    total_scores = 0

    for cp in checkpoints:
        level = cp.get("final_level", RiskLevel.LOW)
        score = cp.get("final_score", 1)
        total_scores += score

        if level == RiskLevel.NO_TRAVEL:
            no_travel_count += 1
        elif level == RiskLevel.SEVERE:
            severe_count += 1
        elif level == RiskLevel.HIGH:
            high_count += 1
        elif level == RiskLevel.MODERATE:
            moderate_count += 1
        else:
            low_count += 1

    # Approximate miles spent in each tier by multiplying checkpoint counts by step interval
    # and normalizing against total route distance
    n = len(checkpoints)
    avg_score = round(total_scores / n, 2)

    # When checkpoints are sampled every step_miles, each checkpoint represents ~step_miles of the route.
    # Cap total estimated miles so it doesn't exceed total_distance_miles.
    severe_miles = round(min(severe_count * step_miles, total_distance_miles), 1)
    high_miles = round(min(high_count * step_miles, total_distance_miles), 1)
    no_travel_miles = round(min(no_travel_count * step_miles, total_distance_miles), 1)
    moderate_miles = round(min(moderate_count * step_miles, total_distance_miles), 1)
    low_miles = round(max(0.0, total_distance_miles - (severe_miles + high_miles + no_travel_miles + moderate_miles)), 1)

    max_score = max(cp.get("final_score", 1) for cp in checkpoints)
    score_to_level = {v: k for k, v in NUMERIC_SCORES.items()}
    max_risk_level = score_to_level[max_score]

    return {
        "severe_miles": severe_miles,
        "high_miles": high_miles,
        "no_travel_miles": no_travel_miles,
        "moderate_miles": moderate_miles,
        "low_miles": low_miles,
        "average_risk": avg_score,
        "max_risk_level": max_risk_level,
        "has_no_travel": no_travel_count > 0,
        "total_distance_miles": round(total_distance_miles, 1),
        "total_duration_seconds": round(total_duration_seconds, 0),
    }


def rank_routes(routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sorts and ranks routes strictly by:
    1. Fewest Severe miles
    2. Fewest High miles
    3. Lowest average risk
    4. Shortest travel time (seconds)

    Marks the top route as recommended.
    """
    def sorting_key(route: Dict[str, Any]) -> Tuple[float, float, float, float]:
        summary = route.get("summary", {})
        return (
            summary.get("severe_miles", 0.0),
            summary.get("high_miles", 0.0),
            summary.get("average_risk", 1.0),
            summary.get("total_duration_seconds", 0.0),
        )

    sorted_routes = sorted(routes, key=sorting_key)

    for rank, route in enumerate(sorted_routes, start=1):
        route["rank"] = rank
        route["is_recommended"] = (rank == 1)

    return sorted_routes

