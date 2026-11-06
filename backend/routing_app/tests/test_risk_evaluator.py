import pytest
from routing_app.services.risk_evaluator import (
    classify_wind,
    classify_rain,
    classify_snow,
    evaluate_checkpoint_risk,
    rank_routes,
    RiskLevel,
    NUMERIC_SCORES,
)


def test_wind_thresholds():
    assert classify_wind(10.0) == RiskLevel.LOW
    assert classify_wind(24.9) == RiskLevel.LOW
    assert classify_wind(25.0) == RiskLevel.MODERATE
    assert classify_wind(34.9) == RiskLevel.MODERATE
    assert classify_wind(35.0) == RiskLevel.HIGH
    assert classify_wind(44.9) == RiskLevel.HIGH
    assert classify_wind(45.0) == RiskLevel.SEVERE
    assert classify_wind(54.9) == RiskLevel.SEVERE
    assert classify_wind(55.0) == RiskLevel.NO_TRAVEL
    assert classify_wind(75.0) == RiskLevel.NO_TRAVEL


def test_rain_thresholds():
    assert classify_rain(0.05) == RiskLevel.LOW
    assert classify_rain(0.09) == RiskLevel.LOW
    assert classify_rain(0.10) == RiskLevel.MODERATE
    assert classify_rain(0.24) == RiskLevel.MODERATE
    assert classify_rain(0.25) == RiskLevel.HIGH
    assert classify_rain(0.49) == RiskLevel.HIGH
    assert classify_rain(0.50) == RiskLevel.SEVERE
    assert classify_rain(1.00) == RiskLevel.SEVERE
    assert classify_rain(1.01) == RiskLevel.NO_TRAVEL


def test_snow_thresholds():
    assert classify_snow(0.2) == RiskLevel.LOW
    assert classify_snow(0.49) == RiskLevel.LOW
    assert classify_snow(0.5) == RiskLevel.MODERATE
    assert classify_snow(0.99) == RiskLevel.MODERATE
    assert classify_snow(1.0) == RiskLevel.HIGH
    assert classify_snow(1.99) == RiskLevel.HIGH
    assert classify_snow(2.0) == RiskLevel.SEVERE
    assert classify_snow(3.0) == RiskLevel.SEVERE
    assert classify_snow(3.1) == RiskLevel.NO_TRAVEL


def test_load_rule_extreme_wind_no_travel():
    # >= 55 mph -> No Travel regardless of weight
    res1 = evaluate_checkpoint_risk(wind_mph=56.0, rain_in_per_hr=0.0, snow_in_per_hr=0.0, load_weight_lbs=15000)
    assert res1["final_level"] == RiskLevel.NO_TRAVEL

    res2 = evaluate_checkpoint_risk(wind_mph=56.0, rain_in_per_hr=0.0, snow_in_per_hr=0.0, load_weight_lbs=60000)
    assert res2["final_level"] == RiskLevel.NO_TRAVEL


def test_load_rule_wind_45_to_54_with_weight_over_30k():
    # 45-54 mph + > 30,000 lb -> No Travel
    res_heavy = evaluate_checkpoint_risk(wind_mph=48.0, rain_in_per_hr=0.0, snow_in_per_hr=0.0, load_weight_lbs=35000)
    assert res_heavy["final_level"] == RiskLevel.NO_TRAVEL
    assert any("No Travel" in o for o in res_heavy["active_overrides"])

    # 45-54 mph + <= 30,000 lb -> Stays Severe (base level for 48 mph)
    res_light = evaluate_checkpoint_risk(wind_mph=48.0, rain_in_per_hr=0.0, snow_in_per_hr=0.0, load_weight_lbs=25000)
    assert res_light["final_level"] == RiskLevel.SEVERE


def test_load_rule_wind_35_to_44_with_weight_over_40k():
    # 35-44 mph + > 40,000 lb -> Severe
    res_heavy = evaluate_checkpoint_risk(wind_mph=38.0, rain_in_per_hr=0.0, snow_in_per_hr=0.0, load_weight_lbs=45000)
    assert res_heavy["final_level"] == RiskLevel.SEVERE
    assert any("Severe" in o for o in res_heavy["active_overrides"])

    # 35-44 mph + <= 40,000 lb -> Stays High
    res_med = evaluate_checkpoint_risk(wind_mph=38.0, rain_in_per_hr=0.0, snow_in_per_hr=0.0, load_weight_lbs=35000)
    assert res_med["final_level"] == RiskLevel.HIGH


def test_route_ranking_logic():
    # Route 1: 0 severe miles, 50 high miles, avg 2.5, time 10000
    # Route 2: 10 severe miles, 0 high miles, avg 1.5, time 8000
    # Route 3: 0 severe miles, 20 high miles, avg 2.2, time 12000
    r1 = {
        "id": "route_1",
        "summary": {"severe_miles": 0.0, "high_miles": 50.0, "average_risk": 2.5, "total_duration_seconds": 10000},
    }
    r2 = {
        "id": "route_2",
        "summary": {"severe_miles": 10.0, "high_miles": 0.0, "average_risk": 1.5, "total_duration_seconds": 8000},
    }
    r3 = {
        "id": "route_3",
        "summary": {"severe_miles": 0.0, "high_miles": 20.0, "average_risk": 2.2, "total_duration_seconds": 12000},
    }

    ranked = rank_routes([r1, r2, r3])
    # Expect r3 first (0 severe, 20 high), then r1 (0 severe, 50 high), then r2 (10 severe)
    assert ranked[0]["id"] == "route_3"
    assert ranked[0]["is_recommended"] is True
    assert ranked[1]["id"] == "route_1"
    assert ranked[1]["is_recommended"] is False
    assert ranked[2]["id"] == "route_2"
    assert ranked[2]["is_recommended"] is False

