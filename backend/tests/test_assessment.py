"""
pytest tests for Assessment endpoint, SiteSuitabilityService, and DeploymentStrategy.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.site_suitability_service import SiteSuitabilityService
from app.services.deployment_strategy import recommend_strategy, recommend_deployment
from app.services.solar_assessment import assess_solar
from app.services.wind_assessment import assess_wind, calculate_wind_class, calculate_capacity_factor

client = TestClient(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_token():
    client.post("/auth/register", json={"username": "assess_tester", "password": "pass1234"})
    resp = client.post(
        "/auth/login",
        data={"username": "assess_tester", "password": "pass1234"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return resp.json().get("access_token", "")


# ── Assessment API ─────────────────────────────────────────────────────────────

class TestAssessmentAPI:
    def test_assessment_requires_auth(self):
        resp = client.get("/assessment", params={"latitude": 13.0, "longitude": 79.0})
        assert resp.status_code == 401

    def test_assessment_returns_full_response(self):
        token = get_token()
        resp = client.get(
            "/assessment",
            params={"latitude": 13.6288, "longitude": 79.4192},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "solar_assessment" in data
        assert "wind_assessment" in data
        assert "terrain_assessment" in data
        assert "infrastructure_assessment" in data
        assert "suitability_score" in data
        assert "deployment_recommendation" in data
        assert "weather_summary" in data

    def test_assessment_suitability_has_score(self):
        token = get_token()
        resp = client.get(
            "/assessment",
            params={"latitude": 20.0, "longitude": 78.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        suit = resp.json()["suitability_score"]
        assert 0.0 <= suit["overall_score"] <= 100.0
        assert suit["category"] in [
            "Excellent", "Highly Suitable", "Moderately Suitable", "Low Suitability", "Unsuitable"
        ]

    def test_assessment_deployment_recommendation_valid(self):
        token = get_token()
        resp = client.get(
            "/assessment",
            params={"latitude": 25.0, "longitude": 80.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        rec = resp.json()["deployment_recommendation"]
        assert rec["deployment"] in ["Solar", "Wind", "Hybrid", "Not Recommended"]
        assert 0 <= rec["confidence"] <= 100
        assert len(rec["reason"]) > 0


# ── SiteSuitabilityService ─────────────────────────────────────────────────────

class TestSiteSuitabilityService:
    def setup_method(self):
        self.service = SiteSuitabilityService()

    def test_calculate_suitability_excellent(self):
        result = self.service.calculate_suitability(90, 90, 90, 90, 90)
        assert result["overall_score"] >= 85
        assert result["category"] == "Excellent"

    def test_calculate_suitability_unsuitable(self):
        result = self.service.calculate_suitability(0, 0, 0, 0, 0)
        assert result["overall_score"] == 0.0
        assert result["category"] == "Unsuitable"

    def test_assess_from_features_returns_all_keys(self):
        result = self.service.assess_suitability_from_features(
            solar_irradiance=6.0, wind_speed=7.0, temperature=28.0,
            slope=5.0, road_distance=2.0, substation_distance=10.0,
            cloud_cover=15.0, latitude=15.0
        )
        for key in ["renewable_resource_score", "terrain_score", "infrastructure_score",
                    "environmental_score", "economic_score", "overall_score", "category"]:
            assert key in result

    def test_score_clamped_between_0_and_100(self):
        result = self.service.assess_suitability_from_features(
            solar_irradiance=0.0, wind_speed=0.0, temperature=50.0,
            slope=45.0, road_distance=100.0, substation_distance=200.0,
            cloud_cover=100.0, latitude=60.0
        )
        assert 0.0 <= result["overall_score"] <= 100.0


# ── DeploymentStrategy ────────────────────────────────────────────────────────

class TestDeploymentStrategy:
    def test_solar_only(self):
        result = recommend_strategy("Excellent", "Unsuitable")
        assert result["deployment"] == "Solar"

    def test_wind_only(self):
        result = recommend_strategy("Unsuitable", "Excellent")
        assert result["deployment"] == "Wind"

    def test_hybrid(self):
        result = recommend_strategy("Excellent", "Excellent")
        assert result["deployment"] == "Hybrid"

    def test_not_recommended(self):
        result = recommend_strategy("Unsuitable", "Unsuitable")
        assert result["deployment"] == "Not Recommended"

    def test_confidence_in_range(self):
        for solar in ["Excellent", "Highly Suitable", "Moderately Suitable", "Unsuitable"]:
            for wind in ["Excellent", "Highly Suitable", "Unsuitable"]:
                result = recommend_strategy(solar, wind)
                assert 0 <= result["confidence"] <= 100


# ── Solar & Wind Assessment ───────────────────────────────────────────────────

class TestSolarAssessment:
    def test_assess_solar_keys(self):
        result = assess_solar(solar_irradiance=6.0, temperature=28.0, slope=5.0)
        for key in ["annual_irradiance", "expected_energy_output", "peak_sun_hours", "capacity_factor",
                    "performance_ratio", "solar_suitability_score", "solar_suitability"]:
            assert key in result

    def test_solar_suitability_category_valid(self):
        result = assess_solar(solar_irradiance=7.5, temperature=25.0, slope=2.0)
        valid_categories = ["Excellent", "Highly Suitable", "Moderately Suitable", "Low Suitability", "Unsuitable"]
        assert result["solar_suitability"] in valid_categories

    def test_high_temperature_reduces_performance_ratio(self):
        res_hot = assess_solar(solar_irradiance=5.0, temperature=45.0, slope=0.0)
        res_mild = assess_solar(solar_irradiance=5.0, temperature=25.0, slope=0.0)
        assert res_hot["performance_ratio"] <= res_mild["performance_ratio"]


class TestWindAssessment:
    def test_wind_class_classification(self):
        assert calculate_wind_class(2.0) == "Poor"
        assert calculate_wind_class(4.0) == "Moderate"
        assert calculate_wind_class(6.0) == "Good"
        assert calculate_wind_class(8.0) == "Excellent"

    def test_capacity_factor_increases_with_speed(self):
        cf_low = calculate_capacity_factor(2.0)
        cf_high = calculate_capacity_factor(8.0)
        assert cf_high > cf_low

    def test_assess_wind_returns_all_keys(self):
        result = assess_wind(wind_speed=7.0)
        for key in ["wind_speed", "wind_class", "capacity_factor",
                    "wind_resource_score", "wind_suitability", "annual_energy_production"]:
            assert key in result
