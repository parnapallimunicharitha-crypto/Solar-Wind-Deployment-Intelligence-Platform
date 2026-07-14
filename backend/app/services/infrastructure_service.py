from app.data_sources.osm import OSMClient


class InfrastructureService:

    def __init__(self):
        self.client = OSMClient()

    def get_infrastructure(self, latitude, longitude):
        return self.client.fetch(latitude, longitude)