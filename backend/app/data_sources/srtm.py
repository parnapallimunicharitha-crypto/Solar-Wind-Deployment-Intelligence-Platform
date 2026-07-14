class SRTMClient:

    def fetch(self, latitude: float, longitude: float) -> dict:
        """
        Fetch elevation data from SRTM.
        """

        print(f"Fetching Elevation for {latitude}, {longitude}")

        return {}


if __name__ == "__main__":
    client = SRTMClient()
    result = client.fetch(13.6288, 79.4192)
    print(result)