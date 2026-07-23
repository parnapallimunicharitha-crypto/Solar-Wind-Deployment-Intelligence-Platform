"""
Normalization Module for Site Assessment Engine.
Provides reusable parameter normalization functions mapping raw values onto a configurable 0-100 scale.
"""

from typing import Union, Optional


def normalize_linear(
    value: Union[int, float, None],
    min_val: float,
    max_val: float,
    invert: bool = False
) -> float:
    """
    Generic linear min-max normalization onto a 0-100 scale.
    
    Args:
        value: Input numerical value to normalize.
        min_val: Configurable minimum bound.
        max_val: Configurable maximum bound.
        invert: If True, lower values produce higher normalized scores.
        
    Returns:
        float: Normalized score clamped safely between 0.0 and 100.0.
    """
    if value is None:
        return 0.0

    try:
        val = float(value)
    except (ValueError, TypeError):
        return 0.0

    # Prevent division-by-zero safely
    if max_val <= min_val:
        return 50.0

    if invert:
        # Scale such that value <= min_val yields 100, and value >= max_val yields 0
        scaled = ((max_val - val) / (max_val - min_val)) * 100.0
    else:
        # Scale such that value <= min_val yields 0, and value >= max_val yields 100
        scaled = ((val - min_val) / (max_val - min_val)) * 100.0

    # Clamp output strictly between 0.0 and 100.0
    clamped = max(0.0, min(100.0, scaled))
    return round(clamped, 2)


def normalize_solar_irradiance(
    value: Union[int, float, None],
    min_val: float = 0.0,
    max_val: float = 10.0
) -> float:
    """
    Normalizes solar irradiance (kWh/m²/day) onto a 0-100 scale.
    Higher irradiance yields higher scores.
    """
    return normalize_linear(value, min_val=min_val, max_val=max_val, invert=False)


def normalize_wind_speed(
    value: Union[int, float, None],
    min_val: float = 0.0,
    max_val: float = 15.0
) -> float:
    """
    Normalizes wind speed (m/s) onto a 0-100 scale.
    Higher wind speed yields higher scores.
    """
    return normalize_linear(value, min_val=min_val, max_val=max_val, invert=False)


def normalize_slope(
    value: Union[int, float, None],
    min_val: float = 0.0,
    max_val: float = 30.0
) -> float:
    """
    Normalizes terrain slope (degrees) onto a 0-100 scale.
    Flatter slope (lower degrees) yields higher scores (inverted).
    """
    return normalize_linear(value, min_val=min_val, max_val=max_val, invert=True)


def normalize_distance_to_grid(
    value: Union[int, float, None],
    min_val: float = 0.0,
    max_val: float = 50.0
) -> float:
    """
    Normalizes distance to power grid/substation (km) onto a 0-100 scale.
    Shorter distance yields higher scores (inverted).
    """
    return normalize_linear(value, min_val=min_val, max_val=max_val, invert=True)


def normalize_distance_to_road(
    value: Union[int, float, None],
    min_val: float = 0.0,
    max_val: float = 30.0
) -> float:
    """
    Normalizes distance to access road (km) onto a 0-100 scale.
    Shorter distance yields higher scores (inverted).
    """
    return normalize_linear(value, min_val=min_val, max_val=max_val, invert=True)


def normalize_elevation(
    value: Union[int, float, None],
    min_val: float = 0.0,
    max_val: float = 3000.0,
    invert: bool = True
) -> float:
    """
    Normalizes elevation (m) onto a 0-100 scale.
    Lower/moderate elevation yields higher scores for build complexity.
    """
    return normalize_linear(value, min_val=min_val, max_val=max_val, invert=invert)
