from app.data_sources.nasa_power import NasaPowerClient


class WeatherService:
    """
    Service to fetch and parse weather data from the NASA POWER API.
    """

    def __init__(self):
        self.client = NasaPowerClient()

    def get_weather(self, latitude: float, longitude: float) -> dict:
        """
        Fetch meteorological data for a given location.

        Returns:
            dict: Solar irradiance, temperature, humidity, rainfall, and cloud cover.
        """
        return self.client.fetch(latitude, longitude)


if __name__ == "__main__":
    service = WeatherService()
    result = service.get_weather(13.6288, 79.4192)
    print(result)