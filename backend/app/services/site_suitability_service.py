"""
Site Suitability Service.
Refactored scoring service integrating reusable normalization, category-wise scoring,
configurable weight mapping, and candidate site ranking modules.
"""

from typing import Dict, List, Optional, Any
from app.services.normalization import (
    normalize_solar_irradiance,
    normalize_wind_speed,
    normalize_slope,
    normalize_distance_to_grid,
    normalize_distance_to_road
)
from app.services.scoring import (
    calculateRenewableScore,
    calculateTerrainScore,
    calculateInfrastructureScore,
    calculateEnvironmentalScore,
    calculateEconomicScore,
    calculateOverallScore
)
from app.services.weights import get_weights, DEFAULT_WEIGHTS
from app.services.ranking import rankCandidateSites


class SiteSuitabilityService:
    """
    Scoring engine to compute renewable site deployment suitability.
    """

    def calculate_suitability(
        self,
        renewable_resource_score: float,
        terrain_score: float,
        infrastructure_score: float,
        environmental_score: float,
        economic_score: float,
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculate overall suitability score using the configurable weighted scoring model.
        """
        scores_dict = {
            "renewable": renewable_resource_score,
            "terrain": terrain_score,
            "infrastructure": infrastructure_score,
            "environment": environmental_score,
            "economic": economic_score
        }
        return calculateOverallScore(scores_dict, weights)

    def assess_suitability_from_features(
        self,
        solar_irradiance: float,
        wind_speed: float,
        temperature: float,
        slope: float,
        road_distance: float,
        substation_distance: float,
        cloud_cover: float = 20.0,
        latitude: float = 15.0,
        elevation: float = 0.0,
        rainfall: float = 800.0,
        capacity_factor: float = 25.0,
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Maps raw environmental data to normalized parameters, computes independent category scores,
        and aggregates into the overall suitability score.
        """
        # 1. Parameter Normalization onto 0-100 scale using reusable functions
        norm_solar = normalize_solar_irradiance(solar_irradiance)
        norm_wind = normalize_wind_speed(wind_speed)
        norm_slope = normalize_slope(slope)
        norm_road = normalize_distance_to_road(road_distance)
        norm_grid = normalize_distance_to_grid(substation_distance)

        # 2. Independent Category Scoring
        renewable_resource_score = calculateRenewableScore(norm_solar, norm_wind)
        terrain_score = calculateTerrainScore(norm_slope, elevation)
        infrastructure_score = calculateInfrastructureScore(norm_road, norm_grid)
        environmental_score = calculateEnvironmentalScore(cloud_cover, temperature, latitude, rainfall)
        economic_score = calculateEconomicScore(norm_grid, norm_road, capacity_factor, substation_distance)

        # 3. Dynamic Composite Overall Score
        return self.calculate_suitability(
            renewable_resource_score=renewable_resource_score,
            terrain_score=terrain_score,
            infrastructure_score=infrastructure_score,
            environmental_score=environmental_score,
            economic_score=economic_score,
            weights=weights
        )

    def rank_sites(
        self,
        candidate_sites: List[Dict[str, Any]],
        weights: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """
        Ranks multiple candidate sites using the scoring engine and returns ordered candidate list.
        """
        return rankCandidateSites(candidate_sites, weights)
