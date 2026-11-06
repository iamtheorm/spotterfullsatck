"""
API Views for Weather-Aware Truck Routing.
"""
import logging
from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from routing_app.serializers import (
    RouteEvaluationRequestSerializer,
    CorridorHeatmapRequestSerializer,
    GeocodeQuerySerializer,
)
from routing_app.services.routing_service import (
    geocode_address,
    get_three_alternative_routes,
)
from routing_app.services.weather_service import fetch_weather_for_checkpoints
from routing_app.services.risk_evaluator import (
    evaluate_checkpoint_risk,
    aggregate_route_metrics,
    rank_routes,
)
from routing_app.services.corridor_service import generate_corridor_grid

logger = logging.getLogger(__name__)


class RouteEvaluationView(APIView):
    """
    Evaluates 3 alternative routes between origin and destination:
    - Samples checkpoints every 10, 25, or 50 miles
    - Fetches ETA-specific weather for every checkpoint
    - Applies condition thresholds and truck load weight rules
    - Ranks routes strictly by (Severe miles -> High miles -> Avg risk -> Duration)
    - Returns ranked GeoJSON routes with checkpoint telemetry and corridor bounding box.
    """

    def post(self, request):
        serializer = RouteEvaluationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        origin_query = data["origin"]
        dest_query = data["destination"]
        departure_time = data["departure_time"]
        load_weight_lbs = data["load_weight"]
        step_miles = float(data["step_miles"])
        ors_key = data.get("ors_api_key") or getattr(settings, "ORS_API_KEY", "")

        # 1. Geocode origin and destination
        origin_geo = geocode_address(origin_query)
        if not origin_geo:
            return Response(
                {"error": f"Could not find coordinates for origin: '{origin_query}'. Try a city, state or 'lat,lon'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dest_geo = geocode_address(dest_query)
        if not dest_geo:
            return Response(
                {"error": f"Could not find coordinates for destination: '{dest_query}'. Try a city, state or 'lat,lon'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orig_lat, orig_lon, orig_name = origin_geo
        dest_lat, dest_lon, dest_name = dest_geo

        # 2. Fetch 3 alternative routes with interpolated checkpoints
        try:
            raw_routes = get_three_alternative_routes(
                start_lat=orig_lat,
                start_lon=orig_lon,
                end_lat=dest_lat,
                end_lon=dest_lon,
                step_miles=step_miles,
                departure_time=departure_time,
                ors_api_key=ors_key,
                origin_name=orig_name,
                dest_name=dest_name,
            )
        except Exception as e:
            logger.error(f"Routing calculation failed: {e}", exc_info=True)
            return Response(
                {"error": f"Failed to calculate routes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not raw_routes:
            return Response(
                {"error": "Failed to generate route alternatives between the specified points."},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # 3. For each route, fetch weather for checkpoints at their ETA and compute risk
        evaluated_routes = []
        routes_coords = []

        for route in raw_routes:
            checkpoints = route.get("checkpoints", [])
            routes_coords.append(route.get("coordinates", []))

            # Fetch weather forecast for each checkpoint at its arrival timestamp
            checkpoints_with_weather = fetch_weather_for_checkpoints(checkpoints)

            # Evaluate risk at each checkpoint
            evaluated_checkpoints = []
            for cp in checkpoints_with_weather:
                wx = cp.get("weather", {})
                wind = wx.get("wind_mph", 0.0)
                rain = wx.get("rain_in_per_hr", 0.0)
                snow = wx.get("snow_in_per_hr", 0.0)

                risk_assessment = evaluate_checkpoint_risk(
                    wind_mph=wind,
                    rain_in_per_hr=rain,
                    snow_in_per_hr=snow,
                    load_weight_lbs=load_weight_lbs,
                )

                evaluated_cp = {
                    **cp,
                    **risk_assessment,
                }
                evaluated_checkpoints.append(evaluated_cp)

            # Calculate route metrics summary
            summary = aggregate_route_metrics(
                checkpoints=evaluated_checkpoints,
                step_miles=step_miles,
                total_distance_miles=route.get("distance_miles", 0.0),
                total_duration_seconds=route.get("duration_seconds", 0.0),
            )

            route_copy = dict(route)
            route_copy["checkpoints"] = evaluated_checkpoints
            route_copy["summary"] = summary
            evaluated_routes.append(route_copy)

        # 4. Rank routes using multi-criteria recommendation logic
        ranked_routes = rank_routes(evaluated_routes)

        # 5. Generate initial corridor heatmap grid for hour 0
        corridor_data = generate_corridor_grid(
            routes_coordinates=routes_coords,
            departure_time=departure_time,
            forecast_hour=0,
        )

        response_payload = {
            "status": "success",
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
            "origin": {
                "name": orig_name,
                "lat": orig_lat,
                "lon": orig_lon,
            },
            "destination": {
                "name": dest_name,
                "lat": dest_lat,
                "lon": dest_lon,
            },
            "params": {
                "departure_time": departure_time.isoformat(),
                "load_weight_lbs": load_weight_lbs,
                "step_miles": step_miles,
            },
            "routes": ranked_routes,
            "corridor": corridor_data,
        }

        return Response(response_payload, status=status.HTTP_200_OK)


class CorridorHeatmapView(APIView):
    """
    Fetches the corridor weather heatmap grid for a given forecast hour offset (0 - 48 hours).
    Enables smooth time-slider forecast evolution along the route corridor.
    """

    def post(self, request):
        serializer = CorridorHeatmapRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        routes_coords = data["routes_coordinates"]
        departure_time = data["departure_time"]
        forecast_hour = data["forecast_hour"]

        corridor_data = generate_corridor_grid(
            routes_coordinates=routes_coords,
            departure_time=departure_time,
            forecast_hour=forecast_hour,
        )

        return Response(corridor_data, status=status.HTTP_200_OK)


class GeocodeView(APIView):
    """Geocodes an address query."""

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"error": "Missing 'q' query parameter"}, status=status.HTTP_400_BAD_REQUEST)

        geo = geocode_address(query)
        if not geo:
            return Response({"error": f"Address not found: '{query}'"}, status=status.HTTP_404_NOT_FOUND)

        lat, lon, display_name = geo
        return Response({"lat": lat, "lon": lon, "display_name": display_name})


class HealthCheckView(APIView):
    """Health check and API metadata endpoint."""

    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "Weather-Aware Truck Routing API",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ors_configured": bool(getattr(settings, "ORS_API_KEY", "")),
        })
