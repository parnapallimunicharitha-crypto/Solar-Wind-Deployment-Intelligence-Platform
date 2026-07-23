from typing import Dict, List, Optional, Any
from app.feature_engineering.feature_builder import FeatureBuilder
from app.services.solar_assessment import assess_solar
from app.services.wind_assessment import assess_wind
from app.services.site_suitability_service import SiteSuitabilityService
from app.services.deployment_strategy import recommend_strategy
from app.services.ranking import rankCandidateSites
from app.services.energy_estimation_service import EnergyEstimationService
from app.services.deployment_optimization_service import DeploymentOptimizationService
from app.services.forecasting_service import ForecastingService
from app.services.investment_recommendation_service import InvestmentRecommendationService


class AssessmentService:
    """
    AssessmentService to orchestrate weather, wind, terrain, infrastructure,
    energy estimations, optimization, forecasting, and investment analysis into a single unified report.
    """

    def __init__(self):
        self.builder = FeatureBuilder()
        self.suitability_service = SiteSuitabilityService()
        self.energy_service = EnergyEstimationService()
        self.optimization_service = DeploymentOptimizationService()
        self.forecasting_service = ForecastingService()
        self.investment_service = InvestmentRecommendationService()

    def perform_assessment(self, latitude: float, longitude: float, weights: Optional[Dict[str, float]] = None) -> Dict:
        """
        Runs the full assessment pipeline for the given coordinates.
        """
        # 1. Fetch/build features
        feats = self.builder.build_features(latitude, longitude)

        # 2. Run Solar Assessment
        solar_res = assess_solar(
            solar_irradiance=feats["solar_irradiance"],
            temperature=feats["temperature"],
            slope=feats["slope"]
        )

        # 3. Run Wind Assessment
        wind_res = assess_wind(
            wind_speed=feats["wind_speed"]
        )

        # 4. Run Site Suitability Scoring using full feature set and configurable weights
        suitability_res = self.suitability_service.assess_suitability_from_features(
            solar_irradiance=feats.get("solar_irradiance", 5.0),
            wind_speed=feats.get("wind_speed", 5.0),
            temperature=feats.get("temperature", 25.0),
            slope=feats.get("slope", 0.0),
            road_distance=feats.get("road_distance", 5.0),
            substation_distance=feats.get("substation_distance", 10.0),
            cloud_cover=feats.get("cloud_cover", 20.0),
            latitude=latitude,
            elevation=feats.get("elevation", 0.0),
            rainfall=feats.get("rainfall", 800.0),
            capacity_factor=wind_res.get("capacity_factor", 25.0),
            weights=weights
        )

        # 5. Run Deployment recommendation
        recommendation_res = recommend_strategy(
            solar_suitability=solar_res["solar_suitability"],
            wind_suitability=wind_res["wind_suitability"]
        )

        # 6. Build Weather Summary
        weather_summary = {
            "solar_irradiance": feats.get("solar_irradiance", 5.0),
            "temperature": feats.get("temperature", 25.0),
            "humidity": feats.get("humidity", 60.0),
            "rainfall": feats.get("rainfall", 0.0),
            "cloud_cover": feats.get("cloud_cover", 20.0),
        }

        # 7. Build Terrain Assessment
        terrain_res = {
            "elevation": feats.get("elevation", 0.0),
            "slope": feats.get("slope", 0.0),
            "terrain_score": suitability_res["terrain_score"],
            "terrain_suitability": feats.get("terrain_suitability", "Unknown"),
        }

        # 8. Build Infrastructure Assessment
        infrastructure_res = {
            "nearest_road": feats.get("road_distance", 0.0),
            "nearest_substation": feats.get("substation_distance", 0.0),
            "transmission_line_distance": feats.get("transmission_line_distance", 0.0),
            "accessibility_score": suitability_res["infrastructure_score"],
        }

        # 9. Calculate Energy Estimation
        energy_estimation_res = self.energy_service.estimate_energy(
            site_evaluation_result={
                "solar_assessment": solar_res,
                "wind_assessment": wind_res,
            },
            deployment_type=recommendation_res["deployment"],
            installed_capacity=1000.0,
            operating_hours=8760.0
        )

        # 10. Deployment Optimization (Module 1, 2 & 3)
        optimization_res = self.optimization_service.optimize_deployment(
            overall_suitability_score=suitability_res["overall_score"],
            solar_resource=weather_summary["solar_irradiance"],
            wind_resource=wind_res["wind_speed"],
            terrain_score=suitability_res["terrain_score"],
            infrastructure_score=suitability_res["infrastructure_score"],
            environmental_score=suitability_res["environmental_score"],
            installed_capacity=1000.0,
            deployment_type=recommendation_res["deployment"]
        )

        # 11. Forecasting (Module 4)
        forecast_res = self.forecasting_service.generate_forecast(
            installed_capacity=optimization_res["optimal_installed_capacity"],
            solar_capacity=optimization_res["solar_capacity"],
            wind_capacity=optimization_res["wind_capacity"],
            deployment_type=optimization_res["recommended_deployment_type"],
            solar_capacity_factor=solar_res.get("capacity_factor", 20.0),
            wind_capacity_factor=wind_res.get("capacity_factor", 35.0)
        )

        # 12. Investment Recommendation (Module 5)
        investment_res = self.investment_service.calculate_investment_metrics(
            annual_energy_kwh=forecast_res["annual_energy_forecast"],
            installed_capacity=optimization_res["optimal_installed_capacity"],
            deployment_type=optimization_res["recommended_deployment_type"]
        )

        return {
            "latitude": latitude,
            "longitude": longitude,
            "weather_summary": weather_summary,
            "solar_assessment": solar_res,
            "wind_assessment": wind_res,
            "terrain_assessment": terrain_res,
            "infrastructure_assessment": infrastructure_res,
            "suitability_score": suitability_res,
            "deployment_recommendation": recommendation_res,
            "energy_estimation": energy_estimation_res,
            "deployment_optimization": optimization_res,
            "forecasting": forecast_res,
            "investment_recommendation": investment_res
        }

    def rank_candidate_sites(self, candidate_sites: List[Dict[str, Any]], weights: Optional[Dict[str, float]] = None) -> List[Dict[str, Any]]:
        """
        Ranks multiple candidate sites using the scoring engine.
        """
        return rankCandidateSites(candidate_sites, weights)

