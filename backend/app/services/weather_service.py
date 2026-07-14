from app.data_sources.nasa_power import NasaPowerClient

class WeatherService:

    def __init__(self):
        self.client = NasaPowerClient()

    def get_weather(self, latitude, longitude):
        return self.client.fetch(latitude, longitude)