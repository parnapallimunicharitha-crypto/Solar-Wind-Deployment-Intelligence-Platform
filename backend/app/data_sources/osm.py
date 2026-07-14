class OSMClient:

    def fetch(self, latitude: float, longitude: float) -> dict:
        """
        Fetch road information from OpenStreetMap.
        """

        print(f"Fetching Road Information for {latitude}, {longitude}")

        return {}


if __name__ == "__main__":
    client = OSMClient()
    result = client.fetch(13.6288, 79.4192)
    print(result)