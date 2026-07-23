from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth.auth_handler import get_db, get_current_user
from app.schemas.optimization import (
    PipelineRunRequest,
    WorkflowPipelineResponse,
    DeploymentOptimizationRequest,
    DeploymentOptimizationResponse,
    ForecastingRequest,
    ForecastingResponse,
    InvestmentRecommendationRequest,
    InvestmentRecommendationResponse
)
from app.services.workflow_pipeline_service import WorkflowPipelineService
from app.services.deployment_optimization_service import DeploymentOptimizationService
from app.services.forecasting_service import ForecastingService
from app.services.investment_recommendation_service import InvestmentRecommendationService
from app.models.site import Site
from app.models.feature import Feature
from app.services.assessment_service import AssessmentService
from typing import List, Dict, Any

router = APIRouter(
    prefix="/pipeline",
    tags=["Deployment Pipeline"]
)

pipeline_service = WorkflowPipelineService()
optimization_service = DeploymentOptimizationService()
forecasting_service = ForecastingService()
investment_service = InvestmentRecommendationService()
assessment_service = AssessmentService()


@router.post("/run", response_model=WorkflowPipelineResponse)
def run_full_pipeline(
    req: PipelineRunRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Execute the full end-to-end deployment pipeline:
    Assessment -> Site Ranking -> Deployment Optimization -> Forecasting -> Investment Recommendation
    """
    try:
        # Retrieve candidate sites for ranking stage
        db_sites = db.query(Site).all()
        candidate_list: List[Dict[str, Any]] = []

        if db_sites:
            for s in db_sites:
                feat = db.query(Feature).filter(Feature.site_id == s.id).first()
                if feat:
                    suit = assessment_service.suitability_service.assess_suitability_from_features(
                        solar_irradiance=feat.solar_irradiance or 5.0,
                        wind_speed=feat.wind_speed or 5.0,
                        temperature=feat.temperature or 25.0,
                        slope=feat.slope or 0.0,
                        road_distance=feat.road_distance or 5.0,
                        substation_distance=feat.substation_distance or 10.0,
                        elevation=feat.elevation or s.elevation or 0.0,
                        latitude=s.latitude
                    )
                    candidate_list.append({
                        "id": s.id,
                        "site_name": getattr(s, "site_name", f"Site #{s.id}"),
                        "latitude": s.latitude,
                        "longitude": s.longitude,
                        "region": s.region or "N/A",
                        "renewable_resource_score": suit["renewable_resource_score"],
                        "terrain_score": suit["terrain_score"],
                        "infrastructure_score": suit["infrastructure_score"],
                        "environmental_score": suit["environmental_score"],
                        "economic_score": suit["economic_score"],
                        "overall_score": suit["overall_score"],
                        "category": suit["category"]
                    })

        constraints_dict = req.constraints.dict(exclude_unset=True) if req.constraints else None

        result = pipeline_service.run_pipeline(
            latitude=req.latitude,
            longitude=req.longitude,
            site_id=req.site_id,
            target_capacity=req.target_capacity or 1000.0,
            preferred_deployment_type=req.preferred_deployment_type or "Hybrid",
            constraints=constraints_dict,
            db_candidate_sites=candidate_list
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline execution failed: {str(e)}"
        )


@router.post("/optimize", response_model=DeploymentOptimizationResponse)
def optimize_deployment_endpoint(
    req: DeploymentOptimizationRequest,
    current_user=Depends(get_current_user)
):
    """
    Run constraint-based deployment optimization for specified parameters.
    """
    try:
        constraints_dict = req.constraints.dict(exclude_unset=True) if req.constraints else None
        return optimization_service.optimize_deployment(
            site_ranking_result=req.site_ranking_result,
            overall_suitability_score=req.overall_suitability_score,
            solar_resource=req.solar_resource,
            wind_resource=req.wind_resource,
            terrain_score=req.terrain_score,
            infrastructure_score=req.infrastructure_score,
            environmental_score=req.environmental_score,
            installed_capacity=req.installed_capacity,
            deployment_type=req.deployment_type,
            constraints=constraints_dict
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Deployment optimization failed: {str(e)}"
        )


@router.post("/forecast", response_model=ForecastingResponse)
def forecast_energy_endpoint(
    req: ForecastingRequest,
    current_user=Depends(get_current_user)
):
    """
    Generate annual, monthly, seasonal, and revenue energy forecasts.
    """
    try:
        return forecasting_service.generate_forecast(
            installed_capacity=req.installed_capacity,
            solar_capacity=req.solar_capacity,
            wind_capacity=req.wind_capacity,
            deployment_type=req.deployment_type,
            solar_capacity_factor=req.solar_capacity_factor or 20.0,
            wind_capacity_factor=req.wind_capacity_factor or 35.0,
            tariff_rate=req.tariff_rate or 0.08
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Energy forecasting failed: {str(e)}"
        )


@router.post("/investment", response_model=InvestmentRecommendationResponse)
def calculate_investment_endpoint(
    req: InvestmentRecommendationRequest,
    current_user=Depends(get_current_user)
):
    """
    Calculate investment performance metrics (CAPEX, OPEX, Payback, NPV, IRR, LCOE) & recommendation.
    """
    try:
        return investment_service.calculate_investment_metrics(
            annual_energy_kwh=req.annual_energy_kwh,
            installed_capacity=req.installed_capacity,
            deployment_type=req.deployment_type,
            tariff_rate=req.tariff_rate or 0.08,
            project_lifetime_years=req.project_lifetime_years or 25,
            discount_rate=req.discount_rate or 0.08
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Investment evaluation failed: {str(e)}"
        )
