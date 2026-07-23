"""
Category-Wise Scoring Module for Site Assessment Engine.
Computes independent category scores (Renewable, Terrain, Infrastructure, Environmental, Economic)
and composite Overall Site Suitability Score using configurable weight mapping.
"""

from typing import Dict, Union, Optional, Any
from app.services.normalization import (
    normalize_solar_irradiance,
    normalize_wind_speed,
    normalize_slope,
    normalize_distance_to_grid,
    normalize_distance_to_road,
    normalize_elevation
)
from app.services.weights import get_weights, get_weight_category_name, DEFAULT_WEIGHTS


def calculateRenewableScore(
    normalized_solar: float,
    normalized_wind: float
) -> float:
    """
    Computes Renewable Resource Score (0-100).
    Calculates ONLY the renewable category score.
    """
    sol = max(0.0, min(100.0, float(normalized_solar or 0.0)))
    wnd = max(0.0, min(100.0, float(normalized_wind or 0.0)))
    
    score = (max(sol, wnd) * 0.7) + (((sol + wnd) / 2.0) * 0.3)
    return round(max(0.0, min(100.0, score)), 2)

calculate_renewable_score = calculateRenewableScore


def calculateTerrainScore(
    normalized_slope: float,
    elevation: Optional[float] = 0.0
) -> float:
    """
    Computes Terrain Score (0-100).
    Calculates ONLY the terrain category score.
    """
    slope_score = max(0.0, min(100.0, float(normalized_slope or 0.0)))
    elev = float(elevation or 0.0)
    
    if elev > 2500:
        elev_factor = max(0.6, 1.0 - ((elev - 2500) / 5000.0))
    else:
        elev_factor = 1.0

    score = slope_score * elev_factor
    return round(max(0.0, min(100.0, score)), 2)

calculate_terrain_score = calculateTerrainScore


def calculateInfrastructureScore(
    road_input: float,
    grid_input: float
) -> float:
    """
    Computes Infrastructure Score (0-100).
    Calculates ONLY the infrastructure category score.
    Accepts either raw distances (km) or pre-normalized parameters.
    """
    r_val = float(road_input or 0.0)
    g_val = float(grid_input or 0.0)

    # Convert raw distances to normalized scores if values are raw distances (>1 or >0)
    if r_val <= 30.0 and g_val <= 50.0:
        road_norm = normalize_distance_to_road(r_val)
        grid_norm = normalize_distance_to_grid(g_val)
    else:
        road_norm = max(0.0, min(100.0, r_val))
        grid_norm = max(0.0, min(100.0, g_val))

    score = (grid_norm * 0.6) + (road_norm * 0.4)
    return round(max(0.0, min(100.0, score)), 2)

calculate_infrastructure_score = calculateInfrastructureScore


def calculateEnvironmentalScore(
    temperature: float = 25.0,
    humidity: float = 60.0,
    terrain: float = 80.0,
    env_risk: float = 15.0,
    cloud_cover: float = 20.0,
    latitude: float = 15.0
) -> float:
    """
    Computes Environmental Score (0-100).
    Calculates ONLY the environmental category score based on environmental parameters.
    """
    c_cover = max(0.0, min(100.0, float(cloud_cover or 0.0)))
    temp = float(temperature or 25.0)
    risk = float(env_risk or 15.0)
    
    # Temperature penalty
    temp_penalty = 0.0
    if temp > 35:
        temp_penalty = (temp - 35) * 1.5
    elif temp < 5:
        temp_penalty = (5 - temp) * 1.0

    score = 100.0 - (c_cover * 0.1) - (risk * 0.3) - temp_penalty
    return round(max(0.0, min(100.0, score)), 2)

calculate_environmental_score = calculateEnvironmentalScore


def calculateEconomicScore(
    accessibility: float = 70.0,
    capacity_factor: float = 25.0,
    expected_energy: float = 1500.0,
    roi: float = 12.0,
    land_util: float = 80.0,
    grid_norm: float = 70.0,
    road_norm: float = 80.0
) -> float:
    """
    Computes Economic Score (0-100).
    Calculates ONLY the economic category score using financial/project parameters.
    """
    access_score = max(0.0, min(100.0, float(accessibility or 70.0)))
    cf_score = max(0.0, min(100.0, float(capacity_factor or 25.0) * 2.5))
    roi_normalized = max(0.0, min(100.0, float(roi or 12.0) * 5.0))
    land_score = max(0.0, min(100.0, float(land_util or 80.0)))

    score = (access_score * 0.3) + (cf_score * 0.3) + (roi_normalized * 0.2) + (land_score * 0.2)
    return round(max(0.0, min(100.0, score)), 2)

calculate_economic_score = calculateEconomicScore


def calculateOverallSuitability(
    scores: Dict[str, float],
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculates dynamic Overall Site Suitability Score using configurable weight mapping.
    
    Returns:
        dict: Breakdown of category scores, weighted contributions, final overall score, and category label.
    """
    cfg_weights = get_weights(weights)
    
    r_score = float(scores.get("renewable", 0.0))
    t_score = float(scores.get("terrain", 0.0))
    i_score = float(scores.get("infrastructure", 0.0))
    env_score = float(scores.get("environment", 0.0))
    eco_score = float(scores.get("economic", 0.0))

    total_weight = sum(cfg_weights.values())
    if total_weight <= 0:
        total_weight = 100.0

    w_ren = cfg_weights.get("renewable", 35) / total_weight
    w_ter = cfg_weights.get("terrain", 25) / total_weight
    w_inf = cfg_weights.get("infrastructure", 15) / total_weight
    w_env = cfg_weights.get("environment", 15) / total_weight
    w_eco = cfg_weights.get("economic", 10) / total_weight

    contrib_ren = round(r_score * w_ren, 2)
    contrib_ter = round(t_score * w_ter, 2)
    contrib_inf = round(i_score * w_inf, 2)
    contrib_env = round(env_score * w_env, 2)
    contrib_eco = round(eco_score * w_eco, 2)

    overall_score = round(contrib_ren + contrib_ter + contrib_inf + contrib_env + contrib_eco, 2)
    overall_score = max(0.0, min(100.0, overall_score))
    category_label = get_weight_category_name(overall_score)

    return {
        "renewable_resource_score": r_score,
        "terrain_score": t_score,
        "infrastructure_score": i_score,
        "environmental_score": env_score,
        "economic_score": eco_score,
        "weighted_contributions": {
            "renewable": contrib_ren,
            "terrain": contrib_ter,
            "infrastructure": contrib_inf,
            "environment": contrib_env,
            "economic": contrib_eco
        },
        "overall_score": overall_score,
        "category": category_label
    }

calculateOverallScore = calculateOverallSuitability
calculate_overall_score = calculateOverallSuitability
calculate_overall_suitability = calculateOverallSuitability
