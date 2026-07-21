from app.services.weather_service import WeatherService
from app.services.wind_service import WindService
from app.services.terrain_service import TerrainService
from app.services.infrastructure_service import InfrastructureService


class FeatureBuilder:
    """
    Builder to pull environmental datasets and compile them into a flat engineered format.
    All available signals from WeatherService, WindService, TerrainService, and
    InfrastructureService are surfaced so downstream assessment engines have full access.
    """

    def __init__(self):
        self.weather = WeatherService()
        self.wind = WindService()
        self.terrain = TerrainService()
        self.infrastructure = InfrastructureService()

    def build_features(self, latitude: float, longitude: float) -> dict:
        """
        Compile flat dictionary of engineered variables for the given location.

        Returns all core environmental signals plus derived engineered features.
        """
        weather_data = self.weather.get_weather(latitude, longitude)
        wind_data = self.wind.get_wind(latitude, longitude)
        terrain_data = self.terrain.get_terrain(latitude, longitude)
        infrastructure_data = self.infrastructure.get_infrastructure(latitude, longitude)

        return {
            # Coordinates
            "latitude": latitude,
            "longitude": longitude,

            # Weather / Environmental
            "solar_irradiance": weather_data.get("solar_irradiance"),
            "temperature": weather_data.get("temperature"),
            "humidity": weather_data.get("humidity"),
            "rainfall": weather_data.get("rainfall"),
            "cloud_cover": weather_data.get("cloud_cover"),

            # Wind
            "wind_speed": wind_data.get("wind_speed"),
            "wind_power_density": wind_data.get("wind_power_density"),
            "wind_class": wind_data.get("wind_class"),
            "capacity_factor": wind_data.get("capacity_factor"),
            "annual_energy_production": wind_data.get("annual_energy_production"),

            # Terrain
            "elevation": terrain_data.get("elevation"),
            "slope": terrain_data.get("slope"),
            "terrain_score": terrain_data.get("terrain_score"),
            "terrain_suitability": terrain_data.get("terrain_suitability"),

            # Infrastructure
            "road_distance": infrastructure_data.get("nearest_road"),
            "substation_distance": infrastructure_data.get("nearest_substation"),
            "transmission_line_distance": infrastructure_data.get("transmission_line_distance"),
            "accessibility_score": infrastructure_data.get("accessibility_score"),
        }


if __name__ == "__main__":
    builder = FeatureBuilder()
    result = builder.build_features(13.6288, 79.4192)
    print(result)