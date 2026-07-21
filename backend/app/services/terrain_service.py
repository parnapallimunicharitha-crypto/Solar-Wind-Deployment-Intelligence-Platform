from app.data_sources.srtm import SRTMClient


class TerrainService:
    """
    Service to fetch terrain characteristics (elevation, slope) and evaluate suitability.
    """

    def __init__(self):
        self.client = SRTMClient()

    def get_terrain(self, latitude: float, longitude: float) -> dict:
        """
        Evaluate terrain metrics at the given coordinate.

        Returns:
            dict: elevation, slope, terrain suitability category, and terrain score.
        """
        data = self.client.fetch(latitude, longitude)
        elevation = data["elevation"]
        slope = data["slope"]

        # Score terrain suitability: gentler slope is more suitable
        # Slope > 30 degrees is generally unsuitable
        terrain_score = max(0.0, min(100.0, 100.0 - (slope * 3.0)))

        if terrain_score >= 85:
            suitability = "Excellent"
        elif terrain_score >= 70:
            suitability = "Good"
        elif terrain_score >= 50:
            suitability = "Moderate"
        else:
            suitability = "Poor"

        return {
            "elevation": elevation,
            "slope": slope,
            "suitability": suitability,          # backward compat
            "terrain_suitability": suitability,  # canonical name
            "score": round(terrain_score, 2),    # backward compat
            "terrain_score": round(terrain_score, 2)  # canonical name
        }


if __name__ == "__main__":
    service = TerrainService()
    result = service.get_terrain(13.6288, 79.4192)
    print(result)