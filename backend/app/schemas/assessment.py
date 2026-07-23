from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union


class SolarAssessmentResponse(BaseModel):
    annual_irradiance: float
    expected_energy_output: float
    peak_sun_hours: float
    capacity_factor: float
    performance_ratio: float
    solar_suitability_score: float
    solar_suitability: str


class WindAssessmentResponse(BaseModel):
    wind_speed: float
    wind_class: str
    capacity_factor: float
    wind_resource_score: float
    wind_suitability: str
    annual_energy_production: float


class TerrainAssessmentResponse(BaseModel):
    elevation: float
    slope: float
    terrain_score: float
    terrain_suitability: str


class InfrastructureAssessmentResponse(BaseModel):
    nearest_road: float
    nearest_substation: float
    transmission_line_distance: float
    accessibility_score: float


class WeatherSummaryResponse(BaseModel):
    solar_irradiance: float
    temperature: float
    humidity: float
    rainfall: float
    cloud_cover: float


class SuitabilityScoreResponse(BaseModel):
    renewable_resource_score: float
    terrain_score: float
    infrastructure_score: float
    environmental_score: float
    economic_score: float
    overall_score: float
    category: str


class DeploymentRecommendationResponse(BaseModel):
    deployment: str
    confidence: float
    reason: str


class CandidateSiteRankItem(BaseModel):
    rank: int
    site_id: Optional[Union[int, str]] = None
    site_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = "N/A"
    renewable_resource_score: float
    terrain_score: float
    infrastructure_score: float
    environmental_score: float
    economic_score: float
    overall_score: float
    category: str
    recommendation: str
    is_best: Optional[bool] = False

    class Config:
        from_attributes = True


class EnergyEstimationResponse(BaseModel):
    solar_energy: float
    wind_energy: float
    total_energy: float
    deployment_type: str
    installed_capacity: float
    capacity_factor_used: Union[float, Dict[str, float]]
    operating_hours: float


class EnergyEstimationRequest(BaseModel):
    deployment_type: str
    installed_capacity: float
    operating_hours: Optional[float] = 8760.0
    solar_capacity_factor: Optional[float] = None
    wind_capacity_factor: Optional[float] = None
    site_evaluation_result: Optional[Dict[str, Any]] = None


class AssessmentResponse(BaseModel):
    latitude: float
    longitude: float
    weather_summary: WeatherSummaryResponse
    solar_assessment: SolarAssessmentResponse
    wind_assessment: WindAssessmentResponse
    terrain_assessment: TerrainAssessmentResponse
    infrastructure_assessment: InfrastructureAssessmentResponse
    suitability_score: SuitabilityScoreResponse
    deployment_recommendation: DeploymentRecommendationResponse
    candidate_ranking: Optional[List[Dict[str, Any]]] = None
    energy_estimation: Optional[EnergyEstimationResponse] = None
    deployment_optimization: Optional[Dict[str, Any]] = None
    forecasting: Optional[Dict[str, Any]] = None
    investment_recommendation: Optional[Dict[str, Any]] = None


