from app.data_sources.osm import OSMClient


class InfrastructureService:
    """
    Service to fetch infrastructure and accessibility metrics for a location.
    """

    def __init__(self):
        self.client = OSMClient()

    def get_infrastructure(self, latitude: float, longitude: float) -> dict:
        """
        Evaluate infrastructure distances and accessibility.

        Returns:
            dict: nearest road, nearest substation, transmission line distance, and accessibility score.
        """
        data = self.client.fetch(latitude, longitude)
        distance_km = data["distance_km"]

        # Derive proxy infrastructure metrics based on nearest populated place
        # Usually, roads are closer (e.g. 10% of city distance + 100m)
        nearest_road = round(distance_km * 0.1 + 0.1, 2)
        # Substations are usually near town borders (e.g. 80% + 2.5km)
        nearest_substation = round(distance_km * 0.8 + 2.5, 2)
        # Transmission lines follow linear paths (e.g. 50% + 1km)
        transmission_line_distance = round(distance_km * 0.5 + 1.0, 2)

        # Accessibility score: higher is better (based on road proximity)
        accessibility_score = max(0.0, min(100.0, 100.0 - (nearest_road * 8.0)))

        return {
            "nearest_road": nearest_road,
            "nearest_substation": nearest_substation,
            "transmission_line_distance": transmission_line_distance,
            "accessibility_score": round(accessibility_score, 2)
        }


if __name__ == "__main__":
    service = InfrastructureService()
    result = service.get_infrastructure(13.6288, 79.4192)
    print(result)