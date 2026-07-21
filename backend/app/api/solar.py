from fastapi import APIRouter, Depends
from app.services.weather_service import WeatherService
from app.schemas.feature import WeatherResponse
from app.auth.auth_handler import get_current_user

router = APIRouter(
    prefix="/solar",
    tags=["Solar Assessment"]
)

service = WeatherService()


@router.get("/features", response_model=WeatherResponse)
def get_features(
    latitude: float,
    longitude: float,
    current_user=Depends(get_current_user)
):
    """
    Fetch NASA POWER solar weather variables (irradiance, temperature, humidity, rainfall, cloud cover) for a location.
    """
    return service.get_weather(latitude, longitude)