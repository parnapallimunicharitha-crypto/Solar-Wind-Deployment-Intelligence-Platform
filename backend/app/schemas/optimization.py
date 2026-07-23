from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union


class OptimizationConstraints(BaseModel):
    max_land_area_sq_km: Optional[float] = Field(None, description="Maximum available land area in sq km")
    budget_limit: Optional[float] = Field(None, description="Maximum budget limit in USD or INR")
    environmental_restrictions: Optional[float] = Field(None, description="Minimum required environmental score or max risk factor")
    grid_capacity: Optional[float] = Field(None, description="Maximum grid injection capacity in MW")
    infrastructure_availability: Optional[float] = Field(None, description="Max allowed distance to substation/road in km")
    transmission_distance: Optional[float] = Field(None, description="Max allowed transmission distance in km")
    road_accessibility: Optional[float] = Field(None, description="Max allowed distance to main road in km")


class DeploymentOptimizationRequest(BaseModel):
    site_ranking_result: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
    overall_suitability_score: float = 75.0
    solar_resource: float = 5.5
    wind_resource: float = 6.2
    terrain_score: float = 70.0
    infrastructure_score: float = 65.0
    environmental_score: float = 80.0
    installed_capacity: float = 1000.0  # target kW
    deployment_type: str = "Hybrid"
    constraints: Optional[OptimizationConstraints] = None


class DeploymentOptimizationResponse(BaseModel):
    optimal_installed_capacity: float  # kW
    recommended_deployment_type: str  # Solar, Wind, Hybrid
    renewable_mix: Dict[str, float]  # e.g., {"solar_pct": 60.0, "wind_pct": 40.0}
    overall_optimization_score: float  # 0-100
    constraint_satisfaction_score: float  # 0-100
    best_capacity: float
    solar_capacity: float  # kW
    wind_capacity: float  # kW
    hybrid_ratio: Dict[str, float]  # e.g., {"solar": 0.6, "wind": 0.4}
    constraint_violations: List[str]
    optimization_status: str  # Optimal, Feasible, Sub-optimal, Infeasible
    feasible: bool


class MonthlyEnergyItem(BaseModel):
    month: str
    solar_energy_kwh: float
    wind_energy_kwh: float
    total_energy_kwh: float


class SeasonalForecastResponse(BaseModel):
    summer_kwh: float
    monsoon_kwh: float
    winter_kwh: float
    spring_kwh: float


class ForecastingRequest(BaseModel):
    installed_capacity: float = 1000.0
    solar_capacity: Optional[float] = None
    wind_capacity: Optional[float] = None
    deployment_type: str = "Hybrid"
    solar_capacity_factor: Optional[float] = 20.0
    wind_capacity_factor: Optional[float] = 35.0
    tariff_rate: Optional[float] = 0.08  # $/kWh or equivalent currency unit


class ForecastingResponse(BaseModel):
    annual_energy_forecast: float  # kWh/yr
    annual_energy_mwh: float  # MWh/yr
    monthly_energy_forecast: List[MonthlyEnergyItem]
    seasonal_forecast: SeasonalForecastResponse
    capacity_utilization_forecast: Union[float, Dict[str, float]]
    revenue_forecast: Dict[str, Any]  # annual_revenue, monthly_revenue, tariff_rate


class InvestmentRecommendationRequest(BaseModel):
    annual_energy_kwh: float = 2500000.0
    installed_capacity: float = 1000.0  # kW
    deployment_type: str = "Hybrid"
    tariff_rate: Optional[float] = 0.08  # $/kWh
    project_lifetime_years: Optional[int] = 25
    discount_rate: Optional[float] = 0.08  # 8%


class InvestmentRecommendationResponse(BaseModel):
    capex: float
    opex: float  # annual
    annual_revenue: float
    roi: float  # %
    payback_period: float  # years
    npv: float  # Net Present Value
    irr: float  # Internal Rate of Return %
    lcoe: float  # Levelized Cost of Energy $/kWh
    investment_risk: str  # Low, Medium, High
    investment_recommendation: str  # Recommended, Conditionally Recommended, Not Recommended


class PipelineRunRequest(BaseModel):
    latitude: float
    longitude: float
    site_id: Optional[int] = None
    target_capacity: Optional[float] = 1000.0  # kW
    preferred_deployment_type: Optional[str] = "Hybrid"
    constraints: Optional[OptimizationConstraints] = None


class WorkflowPipelineResponse(BaseModel):
    latitude: float
    longitude: float
    site_id: Optional[Union[int, str]] = None
    assessment_result: Dict[str, Any]
    candidate_ranking: List[Dict[str, Any]]
    deployment_optimization: DeploymentOptimizationResponse
    forecasting: ForecastingResponse
    investment_recommendation: InvestmentRecommendationResponse
