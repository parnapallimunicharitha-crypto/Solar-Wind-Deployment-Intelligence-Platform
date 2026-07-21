from app.data_sources.global_wind_atlas import GlobalWindAtlasClient
from app.services.wind_assessment import calculate_wind_class, calculate_capacity_factor, calculate_annual_energy_production


class WindService:
    """
    Service to fetch wind statistics and perform initial classification.
    """

    def __init__(self):
        self.client = GlobalWindAtlasClient()

    def get_wind(self, latitude: float, longitude: float) -> dict:
        """
        Retrieve wind metrics for a given coordinate.

        Returns:
            dict: Average wind speed, power density, wind class, capacity factor,
                  and expected annual energy production.
        """
        raw_wind = self.client.fetch(latitude, longitude)
        speed = raw_wind["wind_speed"]
        density = raw_wind["wind_power_density"]
        cf = float(calculate_capacity_factor(speed))

        return {
            "wind_speed": speed,
            "wind_power_density": density,
            "wind_class": calculate_wind_class(speed),
            "capacity_factor": cf,
            "annual_energy_production": calculate_annual_energy_production(cf)
        }


if __name__ == "__main__":
    service = WindService()
    result = service.get_wind(13.6288, 79.4192)
    print(result)