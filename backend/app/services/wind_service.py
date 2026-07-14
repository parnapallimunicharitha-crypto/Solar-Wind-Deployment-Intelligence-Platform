from app.data_sources.global_wind_atlas import GlobalWindAtlasClient


class WindService:

    def __init__(self):
        self.client = GlobalWindAtlasClient()

    def get_wind(self, latitude, longitude):
        return self.client.fetch(latitude, longitude)


if __name__ == "__main__":
    service = WindService()
    result = service.get_wind(13.6288, 79.4192)
    print(result)