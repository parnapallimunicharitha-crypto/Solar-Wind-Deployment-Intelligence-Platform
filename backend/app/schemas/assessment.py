from pydantic import BaseModel
from typing import Optional


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
