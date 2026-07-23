"""
Unit & Integration Tests for Deployment Optimization Pipeline.
Tests Module 1, 2, 3, 4, 5, and 6.
"""

import pytest
from app.services.deployment_optimization_service import DeploymentOptimizationService
from app.services.forecasting_service import ForecastingService
from app.services.investment_recommendation_service import InvestmentRecommendationService
from app.services.workflow_pipeline_service import WorkflowPipelineService


def test_deployment_optimization_service_basic():
    service = DeploymentOptimizationService()
    res = service.optimize_deployment(
        overall_suitability_score=82.5,
        solar_resource=6.2,
        wind_resource=7.1,
        installed_capacity=1000.0,
        deployment_type="Hybrid"
    )

    assert "optimal_installed_capacity" in res
    assert "recommended_deployment_type" in res
    assert "renewable_mix" in res
    assert "overall_optimization_score" in res
    assert "constraint_satisfaction_score" in res
    assert res["feasible"] is True
    assert res["optimization_status"] == "Optimal"
    assert res["optimal_installed_capacity"] == 1000.0
    assert res["best_capacity"] == 1000.0
    assert res["renewable_mix"]["solar_pct"] + res["renewable_mix"]["wind_pct"] == 100.0


def test_deployment_optimization_constraints_grid_and_budget():
    service = DeploymentOptimizationService()
    # Apply strict grid capacity (e.g., max 0.5 MW = 500 kW) and budget constraint
    res = service.optimize_deployment(
        overall_suitability_score=75.0,
        solar_resource=5.5,
        wind_resource=6.0,
        installed_capacity=2000.0,  # 2000 kW target
        deployment_type="Hybrid",
        constraints={
            "grid_capacity": 0.5,  # 0.5 MW -> 500 kW max
            "budget_limit": 800000.0  # $800,000 max budget
        }
    )

    assert res["optimal_installed_capacity"] <= 500.0
    assert len(res["constraint_violations"]) > 0
    assert res["optimization_status"] in ["Feasible", "Sub-optimal"]


def test_forecasting_service():
    service = ForecastingService()
    forecast = service.generate_forecast(
        installed_capacity=1000.0,
        solar_capacity=600.0,
        wind_capacity=400.0,
        deployment_type="Hybrid",
        solar_capacity_factor=20.0,
        wind_capacity_factor=35.0,
        tariff_rate=0.08
    )

    assert forecast["annual_energy_forecast"] > 0
    assert len(forecast["monthly_energy_forecast"]) == 12
    assert "spring_kwh" in forecast["seasonal_forecast"]
    assert "summer_kwh" in forecast["seasonal_forecast"]
    assert "monsoon_kwh" in forecast["seasonal_forecast"]
    assert "winter_kwh" in forecast["seasonal_forecast"]
    assert forecast["revenue_forecast"]["annual_revenue"] > 0


def test_investment_recommendation_service():
    service = InvestmentRecommendationService()
    inv = service.calculate_investment_metrics(
        annual_energy_kwh=2500000.0,
        installed_capacity=1000.0,
        deployment_type="Hybrid",
        tariff_rate=0.08,
        project_lifetime_years=25,
        discount_rate=0.08
    )

    assert inv["capex"] > 0
    assert inv["opex"] > 0
    assert inv["annual_revenue"] > 0
    assert inv["payback_period"] > 0
    assert inv["roi"] > 0
    assert "investment_risk" in inv
    assert inv["investment_recommendation"] in ["Recommended", "Conditionally Recommended", "Not Recommended"]


def test_workflow_pipeline_service_integration():
    pipeline = WorkflowPipelineService()
    res = pipeline.run_pipeline(
        latitude=13.6288,
        longitude=79.4192,
        target_capacity=1000.0,
        preferred_deployment_type="Hybrid"
    )

    assert "assessment_result" in res
    assert "candidate_ranking" in res
    assert "deployment_optimization" in res
    assert "forecasting" in res
    assert "investment_recommendation" in res

    # Verify chain: Assessment -> Optimization -> Forecasting -> Investment
    opt = res["deployment_optimization"]
    forecast = res["forecasting"]
    investment = res["investment_recommendation"]

    assert opt["optimal_installed_capacity"] > 0
    assert forecast["annual_energy_forecast"] > 0
    assert investment["capex"] > 0
