"""
Root wrapper for normalization module.
Re-exports from app.services.normalization for top-level import compatibility.
"""
from app.services.normalization import (
    normalize_linear,
    normalize_solar_irradiance,
    normalize_wind_speed,
    normalize_slope,
    normalize_distance_to_grid,
    normalize_distance_to_road,
    normalize_elevation
)

__all__ = [
    "normalize_linear",
    "normalize_solar_irradiance",
    "normalize_wind_speed",
    "normalize_slope",
    "normalize_distance_to_grid",
    "normalize_distance_to_road",
    "normalize_elevation"
]
