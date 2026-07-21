from app.services.weather_service import WeatherService
from app.services.wind_service import WindService
from app.services.terrain_service import TerrainService
from app.services.infrastructure_service import InfrastructureService


class SpatialAnalysisService:
    """
    Service to combine and return spatial datasets including weather, wind, terrain, and infrastructure.
    """

    def __init__(self):
        self.weather = WeatherService()
        self.wind = WindService()
        self.terrain = TerrainService()
        self.infrastructure = InfrastructureService()

    def analyze_site(self, latitude: float, longitude: float) -> dict:
        """
        Consolidate metrics from all environmental and infrastructure services for a location.

        Returns:
            dict: Combined SiteAnalysis object.
        """
        weather_data = self.weather.get_weather(latitude, longitude)
        wind_data = self.wind.get_wind(latitude, longitude)
        terrain_data = self.terrain.get_terrain(latitude, longitude)
        infrastructure_data = self.infrastructure.get_infrastructure(latitude, longitude)

        return {
            "latitude": latitude,
            "longitude": longitude,
            "weather": weather_data,
            "wind": wind_data,
            "terrain": terrain_data,
            "infrastructure": infrastructure_data
        }


if __name__ == "__main__":
    service = SpatialAnalysisService()
    result = service.analyze_site(13.6288, 79.4192)
    print(result)