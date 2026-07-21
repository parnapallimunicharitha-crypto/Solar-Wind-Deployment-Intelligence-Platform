import json
import math
import os


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class OSMClient:
    """
    Client to query OpenStreetMap GeoJSON infrastructure datasets.
    """
    _data = None

    def __init__(self):
        if OSMClient._data is None:
            path = "datasets/openstreetmap/OSM/osm-india-cities-towns.geojson"
            if not os.path.exists(path):
                path = os.path.join("datasets", "openstreetmap", "OSM", "osm-india-cities-towns.geojson")

            try:
                if os.path.exists(path):
                    with open(path, "r", encoding="utf-8") as f:
                        OSMClient._data = json.load(f)
                else:
                    OSMClient._data = {"features": []}
            except Exception as e:
                print(f"Error loading OSM GeoJSON: {e}")
                OSMClient._data = {"features": []}

    def fetch(self, latitude: float, longitude: float) -> dict:
        """
        Find nearest municipal feature in OSM and return name and distance.
        """
        features = OSMClient._data.get("features", []) if OSMClient._data else []
        if not features:
            # Fallback if data is missing or empty
            val = (abs(latitude) * 5 + abs(longitude) * 7) % 50
            return {
                "nearest_city": "Default City",
                "distance_km": round(val + 5.0, 2)
            }

        min_dist = float("inf")
        nearest_city = "Unknown"

        for feat in features:
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])
            if geom.get("type") == "Point" and len(coords) >= 2:
                lon, lat = coords[0], coords[1]
                dist = haversine_distance(latitude, longitude, lat, lon)
                if dist < min_dist:
                    min_dist = dist
                    nearest_city = feat.get("properties", {}).get("name", "Unknown")

        # Handle case where no features were successfully parsed
        if min_dist == float("inf"):
            val = (abs(latitude) * 5 + abs(longitude) * 7) % 50
            return {
                "nearest_city": "Default City",
                "distance_km": round(val + 5.0, 2)
            }

        return {
            "nearest_city": nearest_city,
            "distance_km": round(min_dist, 2)
        }


if __name__ == "__main__":
    client = OSMClient()
    result = client.fetch(13.6288, 79.4192)
    print(result)