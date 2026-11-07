import pytest
from rest_framework.test import APIClient
from datetime import datetime, timezone


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_health_check_endpoint(client):
    response = client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "SafeCorridor" in data["service"] or "Weather-Aware" in data["service"]


@pytest.mark.django_db
def test_geocode_endpoint(client):
    response = client.get("/api/geocode/?q=Chicago")
    assert response.status_code == 200
    data = response.json()
    assert "lat" in data
    assert "lon" in data
    assert abs(data["lat"] - 41.87) < 1.0


@pytest.mark.django_db
def test_route_evaluation_endpoint(client):
    payload = {
        "origin": "Chicago, IL",
        "destination": "Dallas, TX",
        "departure_time": "2026-11-08T08:00:00Z",
        "load_weight": 35000.0,
        "step_miles": 50,
    }
    response = client.post("/api/routes/evaluate/", payload, format="json")
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert "routes" in data
    assert len(data["routes"]) == 3

    # Check ranking
    routes = data["routes"]
    assert routes[0]["rank"] == 1
    assert routes[0]["is_recommended"] is True
    assert routes[1]["rank"] == 2
    assert routes[1]["is_recommended"] is False
    assert routes[2]["rank"] == 3

    # Check checkpoints
    top_route = routes[0]
    checkpoints = top_route["checkpoints"]
    assert len(checkpoints) > 1

    first_cp = checkpoints[0]
    assert first_cp["mile_marker"] == 0.0
    assert "eta_iso" in first_cp
    assert "weather" in first_cp
    assert "final_level" in first_cp
    assert "final_score" in first_cp

    # Check summary metrics
    summary = top_route["summary"]
    assert "severe_miles" in summary
    assert "high_miles" in summary
    assert "average_risk" in summary
    assert "total_distance_miles" in summary
    assert "total_duration_seconds" in summary

    # Check corridor
    assert "corridor" in data
    assert "points" in data["corridor"]


@pytest.mark.django_db
def test_corridor_heatmap_endpoint(client):
    payload = {
        "routes_coordinates": [
            [[-87.6298, 41.8781], [-89.0, 40.0], [-96.7970, 32.7767]]
        ],
        "departure_time": "2026-11-08T08:00:00Z",
        "forecast_hour": 12,
    }
    response = client.post("/api/corridor/heatmap/", payload, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["forecast_hour"] == 12
    assert "bounds" in data
    assert "points" in data
    assert len(data["points"]) > 0
    assert "intensity" in data["points"][0]

