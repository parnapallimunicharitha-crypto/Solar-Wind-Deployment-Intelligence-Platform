from typing import Dict
from app.feature_engineering.feature_builder import FeatureBuilder
from app.services.solar_assessment import assess_solar
from app.services.wind_assessment import assess_wind
from app.services.site_suitability_service import SiteSuitabilityService
from app.services.deployment_strategy import recommend_strategy


class AssessmentService:
    """
    AssessmentService to orchestrate and combine weather, wind, terrain,
    and infrastructure evaluations for any coordinates into a single unified report.
    """

    def __init__(self):
        self.builder = FeatureBuilder()
        self.suitability_service = SiteSuitabilityService()

    def perform_assessment(self, latitude: float, longitude: float) -> Dict:
        """
        Runs the full assessment pipeline for the given coordinates.
        """
        # 1. Fetch/build features
        feats = self.builder.build_features(latitude, longitude)

        # 2. Run Solar Assessment
        solar_res = assess_solar(
            solar_irradiance=feats["solar_irradiance"],
            temperature=feats["temperature"],
            slope=feats["slope"]
        )

        # 3. Run Wind Assessment
        wind_res = assess_wind(
            wind_speed=feats["wind_speed"]
        )

        # 4. Run Site Suitability Scoring
        suitability_res = self.suitability_service.assess_suitability_from_features(
            solar_irradiance=feats["solar_irradiance"],
            wind_speed=feats["wind_speed"],
            temperature=feats["temperature"],
            slope=feats["slope"],
            road_distance=feats["road_distance"],
            substation_distance=feats["substation_distance"],
            cloud_cover=feats.get("cloud_cover", 20.0),
            latitude=latitude
        )

        # 5. Run Deployment recommendation
        recommendation_res = recommend_strategy(
            solar_suitability=solar_res["solar_suitability"],
            wind_suitability=wind_res["wind_suitability"]
        )

        # 6. Build Weather Summary
        weather_summary = {
            "solar_irradiance": feats.get("solar_irradiance", 5.0),
            "temperature": feats.get("temperature", 25.0),
            "humidity": feats.get("humidity", 60.0),
            "rainfall": feats.get("rainfall", 0.0),
            "cloud_cover": feats.get("cloud_cover", 20.0),
        }

        # 7. Build Terrain Assessment
        terrain_res = {
            "elevation": feats.get("elevation", 0.0),
            "slope": feats.get("slope", 0.0),
            "terrain_score": feats.get("terrain_score", 0.0),
            "terrain_suitability": feats.get("terrain_suitability", "Unknown"),
        }

        # 8. Build Infrastructure Assessment
        infrastructure_res = {
            "nearest_road": feats.get("road_distance", 0.0),
            "nearest_substation": feats.get("substation_distance", 0.0),
            "transmission_line_distance": feats.get("transmission_line_distance", 0.0),
            "accessibility_score": feats.get("accessibility_score", 0.0),
        }

        return {
            "latitude": latitude,
            "longitude": longitude,
            "weather_summary": weather_summary,
            "solar_assessment": solar_res,
            "wind_assessment": wind_res,
            "terrain_assessment": terrain_res,
            "infrastructure_assessment": infrastructure_res,
            "suitability_score": suitability_res,
            "deployment_recommendation": recommendation_res
        }
