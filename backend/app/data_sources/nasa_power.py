class NasaPowerClient:

    def fetch(self, latitude: float, longitude: float) -> dict:
        """
        Fetch weather data from NASA POWER.

        Inputs:
            latitude (float)
            longitude (float)

        Returns:
            dict

        Possible Errors:
            ConnectionError
            ValueError
        """

        print(f"Fetching NASA POWER data for {latitude}, {longitude}")

        return {}


if __name__ == "__main__":
    client = NasaPowerClient()
    result = client.fetch(13.6288, 79.4192)
    print(result)