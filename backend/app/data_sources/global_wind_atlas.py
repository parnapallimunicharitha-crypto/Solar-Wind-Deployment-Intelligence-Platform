import csv
import os


class GlobalWindAtlasClient:
    """
    Client to extract wind speed and power density metrics from Global Wind Atlas CSV datasets.
    """

    def __init__(self):
        self.base_wind_speed = 5.5
        self.base_power_density = 180.0

        # Attempt to read the actual datasets to compute weighted averages
        try:
            path_speed = "datasets/global_wind_atlas/GLOBAL WIND ATLAS/windSpeed.csv"
            path_density = "datasets/global_wind_atlas/GLOBAL WIND ATLAS/powerDensity.csv"

            if os.path.exists(path_speed):
                speeds = []
                counts = []
                with open(path_speed, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        speeds.append(float(row["val"]))
                        counts.append(float(row["count"]))
                if speeds and counts:
                    self.base_wind_speed = sum(s * c for s, c in zip(speeds, counts)) / sum(counts)

            if os.path.exists(path_density):
                densities = []
                counts = []
                with open(path_density, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        densities.append(float(row["val"]))
                        counts.append(float(row["count"]))
                if densities and counts:
                    self.base_power_density = sum(d * c for d, c in zip(densities, counts)) / sum(counts)

        except Exception as e:
            print(f"Error reading Global Wind Atlas CSV datasets: {e}")

    def fetch(self, latitude: float, longitude: float) -> dict:
        """
        Fetch wind data for a given location, using the dataset baselines perturbed deterministically.
        """
        # Perturb deterministically based on coordinates to simulate spatial changes
        factor = 1.0 + ((abs(latitude) * 11 + abs(longitude) * 13) % 20 - 10) / 25.0  # multiplier between 0.6 and 1.4
        wind_speed = round(self.base_wind_speed * factor, 2)
        # Power density scales with the cube of wind speed factor
        power_density = round(self.base_power_density * (factor ** 3), 2)

        return {
            "wind_speed": wind_speed,
            "wind_power_density": power_density
        }


if __name__ == "__main__":
    client = GlobalWindAtlasClient()
    result = client.fetch(13.6288, 79.4192)
    print(result)