from app.data_sources.srtm import SRTMClient


class TerrainService:

    def __init__(self):
        self.client = SRTMClient()

    def get_terrain(self, latitude, longitude):
        return self.client.fetch(latitude, longitude)