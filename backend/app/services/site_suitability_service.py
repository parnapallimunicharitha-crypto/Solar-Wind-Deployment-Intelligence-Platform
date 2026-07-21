class SiteSuitabilityService:
    """
    Scoring engine to compute renewable site deployment suitability.
    """

    def calculate_suitability(
        self,
        renewable_resource_score: float,
        terrain_score: float,
        infrastructure_score: float,
        environmental_score: float,
        economic_score: float
    ) -> dict:
        """
        Calculate overall suitability score using the weighted scoring model.
        Weights:
            Renewable Resource Score: 35%
            Terrain Score: 25%
            Infrastructure Score: 15%
            Environmental Score: 15%
            Economic Score: 10%
        """
        overall_score = (
            renewable_resource_score * 0.35 +
            terrain_score * 0.25 +
            infrastructure_score * 0.15 +
            environmental_score * 0.15 +
            economic_score * 0.10
        )
        overall_score = round(overall_score, 2)

        if overall_score >= 85:
            category = "Excellent"
        elif overall_score >= 70:
            category = "Highly Suitable"
        elif overall_score >= 55:
            category = "Moderately Suitable"
        elif overall_score >= 40:
            category = "Low Suitability"
        else:
            category = "Unsuitable"

        return {
            "overall_score": overall_score,
            "category": category
        }

    def assess_suitability_from_features(
        self,
        solar_irradiance: float,
        wind_speed: float,
        temperature: float,
        slope: float,
        road_distance: float,
        substation_distance: float,
        cloud_cover: float,
        latitude: float
    ) -> dict:
        """
        Helper to map environmental raw data to suitability components and evaluate.
        """
        # 1. Renewable Resource Score
        solar_score = max(0.0, min(100.0, (solar_irradiance / 8.0) * 100.0 - slope * 2.5))
        wind_score = max(0.0, min(100.0, (wind_speed / 12.0) * 100.0))
        renewable_resource_score = max(solar_score, wind_score)

        # 2. Terrain Score
        terrain_score = max(0.0, min(100.0, 100.0 - (slope * 3.0)))

        # 3. Infrastructure Score
        infrastructure_score = max(0.0, min(100.0, 100.0 - (road_distance * 8.0)))

        # 4. Environmental Score
        environmental_score = max(0.0, min(100.0, 95.0 - (cloud_cover * 0.1) - (abs(latitude) % 5) * 2))

        # 5. Economic Score
        economic_score = max(0.0, min(100.0, 100.0 - (substation_distance * 3.0) - (road_distance * 4.0)))

        scores = self.calculate_suitability(
            renewable_resource_score,
            terrain_score,
            infrastructure_score,
            environmental_score,
            economic_score
        )

        return {
            "renewable_resource_score": round(renewable_resource_score, 2),
            "terrain_score": round(terrain_score, 2),
            "infrastructure_score": round(infrastructure_score, 2),
            "environmental_score": round(environmental_score, 2),
            "economic_score": round(economic_score, 2),
            "overall_score": scores["overall_score"],
            "category": scores["category"]
        }
