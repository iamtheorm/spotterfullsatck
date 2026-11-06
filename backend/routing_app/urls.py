from django.urls import path
from routing_app.views import (
    RouteEvaluationView,
    CorridorHeatmapView,
    GeocodeView,
    HealthCheckView,
)

urlpatterns = [
    path("routes/evaluate/", RouteEvaluationView.as_view(), name="routes-evaluate"),
    path("corridor/heatmap/", CorridorHeatmapView.as_view(), name="corridor-heatmap"),
    path("geocode/", GeocodeView.as_view(), name="geocode"),
    path("health/", HealthCheckView.as_view(), name="health-check"),
]

