"""
Serializers for Weather-Aware Truck Routing API.
"""
from rest_framework import serializers
from datetime import datetime


class RouteEvaluationRequestSerializer(serializers.Serializer):
    origin = serializers.CharField(
        max_length=200,
        required=True,
        help_text="Origin address, city, or coordinates (e.g. 'Chicago, IL' or '41.87,-87.62')",
    )
    destination = serializers.CharField(
        max_length=200,
        required=True,
        help_text="Destination address, city, or coordinates (e.g. 'Dallas, TX' or '32.77,-96.79')",
    )
    departure_time = serializers.DateTimeField(
        required=True,
        help_text="Truck departure timestamp in ISO 8601 format",
    )
    load_weight = serializers.FloatField(
        required=True,
        min_value=1.0,
        max_value=150000.0,
        help_text="Gross load weight in lbs (e.g., 35000)",
    )
    step_miles = serializers.ChoiceField(
        choices=[10, 25, 50],
        default=25,
        help_text="Sampling checkpoint interval in miles (10, 25, or 50)",
    )
    weather_scenario = serializers.ChoiceField(
        choices=["live", "severe_storm", "high_winds", "winter_blizzard"],
        default="live",
        required=False,
        help_text="Weather simulation mode: live (Open-Meteo), severe_storm, high_winds, or winter_blizzard",
    )
    ors_api_key = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="Optional custom OpenRouteService API key",
    )


class GeocodeQuerySerializer(serializers.Serializer):
    query = serializers.CharField(max_length=200, required=True)


class CorridorHeatmapRequestSerializer(serializers.Serializer):
    routes_coordinates = serializers.ListField(
        child=serializers.ListField(
            child=serializers.ListField(
                child=serializers.FloatField(),
                min_length=2,
                max_length=2,
            )
        ),
        required=True,
        help_text="List of GeoJSON route line coordinates",
    )
    departure_time = serializers.DateTimeField(required=True)
    forecast_hour = serializers.IntegerField(min_value=0, max_value=48, default=0)

