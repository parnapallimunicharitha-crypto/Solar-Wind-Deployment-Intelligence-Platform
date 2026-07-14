class GlobalWindAtlasClient:

    def fetch(self, latitude: float, longitude: float) -> dict:
        """
        Fetch wind data from Global Wind Atlas.
        """

        print(f"Fetching Wind Atlas data for {latitude}, {longitude}")

        return {}


if __name__ == "__main__":
    client = GlobalWindAtlasClient()
    result = client.fetch(13.6288, 79.4192)
    print(result)