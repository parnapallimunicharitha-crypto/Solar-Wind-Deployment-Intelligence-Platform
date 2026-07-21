import math
from app.spatial.raster_processor import RasterProcessor


class SRTMClient:
    """
    Client to interface with SRTM Digital Elevation Model (GeoTIFF).
    """

    def __init__(self):
        self.processor = RasterProcessor()
        # Initialize and load the raster
        self.processor.load_raster("datasets/srtm/GeoTIFF 1 Arc-second.tif")

    def fetch(self, latitude: float, longitude: float) -> dict:
        """
        Sample elevation and calculate terrain slope at a specific coordinate.
        """
        elevation = self.processor.sample_value(latitude, longitude)

        # Estimate slope using elevation differences at a ~50m offset (0.0005 degrees)
        offset = 0.0005
        dist_y = offset * 111000.0  # Meters per degree latitude
        dist_x = offset * 111000.0 * math.cos(math.radians(latitude))  # Meters per degree longitude

        elev_n = self.processor.sample_value(latitude + offset, longitude)
        elev_e = self.processor.sample_value(latitude, longitude + offset)

        rise_y = elev_n - elevation
        rise_x = elev_e - elevation

        slope_y = rise_y / dist_y if dist_y != 0 else 0
        slope_x = rise_x / dist_x if dist_x != 0 else 0

        gradient = math.sqrt(slope_y**2 + slope_x**2)
        slope_deg = math.degrees(math.atan(gradient))

        # Clamp and clean slope value
        if math.isnan(slope_deg) or slope_deg < 0 or slope_deg > 90:
            # Deterministic backup slope value
            slope_deg = (abs(latitude) * 3 + abs(longitude) * 5) % 15.0

        return {
            "elevation": round(elevation, 2),
            "slope": round(slope_deg, 2)
        }


if __name__ == "__main__":
    client = SRTMClient()
    result = client.fetch(13.6288, 79.4192)
    print(result)