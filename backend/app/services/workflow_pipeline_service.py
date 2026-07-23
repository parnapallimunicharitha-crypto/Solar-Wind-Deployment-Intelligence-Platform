"""
Workflow Pipeline Service

Orchestrates the multi-stage deployment intelligence workflow:
Assessment -> Site Ranking -> Deployment Optimization -> Forecasting -> Investment Recommendation -> Dashboard.
Reuses existing AssessmentService, SiteSuitabilityService, DeploymentOptimizationService,
ForecastingService, and InvestmentRecommendationService without duplicating logic.
"""

from typing import Dict, List, Optional, Any, Union
from app.services.assessment_service import AssessmentService
from app.services.deployment_optimization_service import DeploymentOptimizationService
from app.services.forecasting_service import ForecastingService
from app.services.investment_recommendation_service import InvestmentRecommendationService


class WorkflowPipelineService:
    """
    Unified Pipeline Service that connects assessment, ranking, optimization, forecasting,
    and financial evaluation sequentially.
    """

    def __init__(self):
        self.assessment_service = AssessmentService()
        self.optimization_service = DeploymentOptimizationService()
        self.forecasting_service = ForecastingService()
        self.investment_service = InvestmentRecommendationService()

    def run_pipeline(
        self,
        latitude: float,
        longitude: float,
        site_id: Optional[Union[int, str]] = None,
        target_capacity: float = 1000.0,
        preferred_deployment_type: str = "Hybrid",
        constraints: Optional[Dict[str, Any]] = None,
        db_candidate_sites: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Runs the complete end-to-end 5-stage deployment pipeline for a coordinate/site.

        :param latitude: Target site latitude
        :param longitude: Target site longitude
        :param site_id: Optional site identifier
        :param target_capacity: Initial target installed capacity in kW
        :param preferred_deployment_type: Preferred recommendation type
        :param constraints: Deployment constraint parameters
        :param db_candidate_sites: Optional registered candidate sites to rank against
        :return: Dict matching WorkflowPipelineResponse schema
        """
        # ── Stage 1: Resource Assessment ──────────────────────────────────────
        assessment_res = self.assessment_service.perform_assessment(latitude, longitude)

        # ── Stage 2: Site Ranking ──────────────────────────────────────────────
        candidate_list = list(db_candidate_sites or [])
        # Include current coordinate as target site candidate
        candidate_list.append({
            "id": site_id or "current",
            "site_name": f"Assessed Location ({latitude:.3f}, {longitude:.3f})",
            "latitude": latitude,
            "longitude": longitude,
            "region": "Current Query",
            "renewable_resource_score": assessment_res["suitability_score"]["renewable_resource_score"],
            "terrain_score": assessment_res["suitability_score"]["terrain_score"],
            "infrastructure_score": assessment_res["suitability_score"]["infrastructure_score"],
            "environmental_score": assessment_res["suitability_score"]["environmental_score"],
            "economic_score": assessment_res["suitability_score"]["economic_score"],
            "overall_score": assessment_res["suitability_score"]["overall_score"],
            "category": assessment_res["suitability_score"]["category"]
        })
        ranked_candidates = self.assessment_service.rank_candidate_sites(candidate_list)
        assessment_res["candidate_ranking"] = ranked_candidates

        # ── Stage 3: Deployment Optimization ──────────────────────────────────
        suitability_score_dict = assessment_res.get("suitability_score", {})
        weather_dict = assessment_res.get("weather_summary", {})
        wind_dict = assessment_res.get("wind_assessment", {})
        rec_dict = assessment_res.get("deployment_recommendation", {})

        opt_res = self.optimization_service.optimize_deployment(
            site_ranking_result=ranked_candidates,
            overall_suitability_score=suitability_score_dict.get("overall_score", 75.0),
            solar_resource=weather_dict.get("solar_irradiance", 5.5),
            wind_resource=wind_dict.get("wind_speed", 6.2),
            terrain_score=suitability_score_dict.get("terrain_score", 70.0),
            infrastructure_score=suitability_score_dict.get("infrastructure_score", 65.0),
            environmental_score=suitability_score_dict.get("environmental_score", 80.0),
            installed_capacity=target_capacity,
            deployment_type=preferred_deployment_type or rec_dict.get("deployment", "Hybrid"),
            constraints=constraints
        )

        # ── Stage 4: Energy Forecasting ───────────────────────────────────────
        sol_cf = assessment_res.get("solar_assessment", {}).get("capacity_factor", 20.0)
        wnd_cf = wind_dict.get("capacity_factor", 35.0)

        forecast_res = self.forecasting_service.generate_forecast(
            installed_capacity=opt_res["optimal_installed_capacity"],
            solar_capacity=opt_res["solar_capacity"],
            wind_capacity=opt_res["wind_capacity"],
            deployment_type=opt_res["recommended_deployment_type"],
            solar_capacity_factor=sol_cf,
            wind_capacity_factor=wnd_cf,
            tariff_rate=0.08
        )

        # ── Stage 5: Investment Recommendation ────────────────────────────────
        investment_res = self.investment_service.calculate_investment_metrics(
            annual_energy_kwh=forecast_res["annual_energy_forecast"],
            installed_capacity=opt_res["optimal_installed_capacity"],
            deployment_type=opt_res["recommended_deployment_type"],
            tariff_rate=0.08,
            project_lifetime_years=25,
            discount_rate=0.08
        )

        return {
            "latitude": latitude,
            "longitude": longitude,
            "site_id": site_id,
            "assessment_result": assessment_res,
            "candidate_ranking": ranked_candidates,
            "deployment_optimization": opt_res,
            "forecasting": forecast_res,
            "investment_recommendation": investment_res
        }
