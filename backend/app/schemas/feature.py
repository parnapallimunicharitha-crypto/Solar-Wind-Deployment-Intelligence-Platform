from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class WeatherResponse(BaseModel):
    solar_irradiance: float
    temperature: float
    humidity: float
    rainfall: float
    cloud_cover: float


class FeatureCreate(BaseModel):
    latitude: float
    longitude: float
    solar_irradiance: Optional[float] = None
    wind_speed: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    elevation: Optional[float] = None
    slope: Optional[float] = None
    road_distance: Optional[float] = None
    substation_distance: Optional[float] = None
    capacity_factor: Optional[float] = None
    wind_class: Optional[str] = None
    terrain_score: Optional[float] = None
    accessibility_score: Optional[float] = None
    site_id: Optional[int] = None



class FeatureResponse(FeatureCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True