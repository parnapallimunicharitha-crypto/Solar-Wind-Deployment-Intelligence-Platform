"""
Automated unit and integration tests for the Energy Estimation Module.

Verifies:
1. Input validation for solar & wind energy estimation functions.
2. Rule 1: Higher capacity factor produces higher annual energy.
3. Rule 2: Larger installed capacity produces larger annual energy.
4. Rule 3: Hybrid total energy equals Solar + Wind.
5. Sample Site A (High solar, Low wind), Site B (Medium solar, High wind), Site C (Hybrid).
6. EnergyEstimationService logic and FastAPI POST /assessment/energy-estimate endpoint.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.energy_estimation_service import (
    calculate_solar_energy,
    calculate_wind_energy,
    EnergyEstimationService
)

client = TestClient(app)


def get_auth_token():
    client.post("/auth/register", json={"username": "energy_tester", "password": "pass1234"})
    resp = client.post(
        "/auth/login",
        data={"username": "energy_tester", "password": "pass1234"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return resp.json().get("access_token", "")


# ── Task 1: Solar Energy Calculation Tests ──────────────────────────────────

class TestSolarEnergyCalculation:
    def test_calculate_solar_energy_standard(self):
        # 1000 kW * 20% CF * 8760 hrs = 1,752,000 kWh
        energy = calculate_solar_energy(1000.0, 20.0, 8760.0)
        assert energy == 1752000.0

    def test_calculate_solar_energy_decimal_cf(self):
        # 1000 kW * 0.20 CF * 8760 hrs = 1,752,000 kWh
        energy = calculate_solar_energy(1000.0, 0.20, 8760.0)
        assert energy == 1752000.0

    def test_calculate_solar_energy_custom_operating_hours(self):
        # Verify operating_hours is configurable and NOT hardcoded to 8760
        energy_half_year = calculate_solar_energy(1000.0, 20.0, 4380.0)
        energy_full_year = calculate_solar_energy(1000.0, 20.0, 8760.0)
        assert energy_half_year == energy_full_year / 2.0

    def test_calculate_solar_energy_rejects_negative_capacity(self):
        with pytest.raises(ValueError, match="Installed capacity cannot be negative"):
            calculate_solar_energy(-100.0, 20.0, 8760.0)

    def test_calculate_solar_energy_rejects_negative_capacity_factor(self):
        with pytest.raises(ValueError, match="Capacity factor cannot be negative"):
            calculate_solar_energy(1000.0, -10.0, 8760.0)

    def test_calculate_solar_energy_rejects_negative_operating_hours(self):
        with pytest.raises(ValueError, match="Operating hours cannot be negative"):
            calculate_solar_energy(1000.0, 20.0, -8760.0)

    def test_calculate_solar_energy_rejects_excessive_capacity_factor(self):
        with pytest.raises(ValueError, match="Capacity factor cannot exceed 100%"):
            calculate_solar_energy(1000.0, 150.0, 8760.0)


# ── Task 2: Wind Energy Calculation Tests ───────────────────────────────────

class TestWindEnergyCalculation:
    def test_calculate_wind_energy_standard(self):
        # 1000 kW * 35% CF * 8760 hrs = 3,066,000 kWh
        energy = calculate_wind_energy(1000.0, 35.0, 8760.0)
        assert energy == 3066000.0

    def test_calculate_wind_energy_custom_operating_hours(self):
        energy = calculate_wind_energy(500.0, 40.0, 8000.0)
        assert energy == 1600000.0

    def test_calculate_wind_energy_rejects_negative_inputs(self):
        with pytest.raises(ValueError):
            calculate_wind_energy(-500.0, 30.0, 8760.0)
        with pytest.raises(ValueError):
            calculate_wind_energy(500.0, -5.0, 8760.0)
        with pytest.raises(ValueError):
            calculate_wind_energy(500.0, 30.0, -100.0)


# ── Task 5: Validation Rules & Scenarios ─────────────────────────────────────

class TestEnergyValidationRules:
    def test_rule_1_higher_capacity_factor_produces_higher_energy(self):
        """Rule 1: Higher capacity factor produces higher annual energy."""
        capacity = 1000.0
        hours = 8760.0
        
        solar_low_cf = calculate_solar_energy(capacity, 15.0, hours)
        solar_high_cf = calculate_solar_energy(capacity, 25.0, hours)
        assert solar_high_cf > solar_low_cf

        wind_low_cf = calculate_wind_energy(capacity, 20.0, hours)
        wind_high_cf = calculate_wind_energy(capacity, 45.0, hours)
        assert wind_high_cf > wind_low_cf

    def test_rule_2_larger_installed_capacity_produces_larger_energy(self):
        """Rule 2: Larger installed capacity produces larger annual energy."""
        cf = 22.0
        hours = 8760.0

        solar_small_cap = calculate_solar_energy(500.0, cf, hours)
        solar_large_cap = calculate_solar_energy(2000.0, cf, hours)
        assert solar_large_cap > solar_small_cap

        wind_small_cap = calculate_wind_energy(500.0, 35.0, hours)
        wind_large_cap = calculate_wind_energy(2000.0, 35.0, hours)
        assert wind_large_cap > wind_small_cap

    def test_rule_3_hybrid_total_equals_solar_plus_wind(self):
        """Rule 3: Hybrid total energy equals Solar + Wind energy."""
        service = EnergyEstimationService()
        result = service.estimate_energy(
            deployment_type="Hybrid",
            installed_capacity=1000.0,
            solar_capacity_factor=22.5,
            wind_capacity_factor=38.0,
            operating_hours=8760.0
        )
        assert result["total_energy"] == round(result["solar_energy"] + result["wind_energy"], 2)


# ── Sample Site Validation Scenarios ─────────────────────────────────────────

class TestSampleSites:
    def setup_method(self):
        self.service = EnergyEstimationService()

    def test_site_a_high_solar_low_wind(self):
        """
        Site A: High Solar (CF 25.0%), Low Wind (CF 10.0%)
        Deployment = Solar -> Returns Solar energy only.
        """
        eval_result = {
            "solar_assessment": {"capacity_factor": 25.0},
            "wind_assessment": {"capacity_factor": 10.0}
        }
        res = self.service.estimate_energy(
            site_evaluation_result=eval_result,
            deployment_type="Solar",
            installed_capacity=1000.0
        )
        assert res["solar_energy"] == 2190000.0
        assert res["wind_energy"] == 0.0
        assert res["total_energy"] == 2190000.0
        assert res["deployment_type"] == "Solar"

    def test_site_b_medium_solar_high_wind(self):
        """
        Site B: Medium Solar (CF 18.0%), High Wind (CF 45.0%)
        Deployment = Wind -> Returns Wind energy only.
        """
        eval_result = {
            "solar_assessment": {"capacity_factor": 18.0},
            "wind_assessment": {"capacity_factor": 45.0}
        }
        res = self.service.estimate_energy(
            site_evaluation_result=eval_result,
            deployment_type="Wind",
            installed_capacity=1000.0
        )
        assert res["solar_energy"] == 0.0
        assert res["wind_energy"] == 3942000.0
        assert res["total_energy"] == 3942000.0
        assert res["deployment_type"] == "Wind"

    def test_site_c_hybrid(self):
        """
        Site C: High Solar (CF 24.0%), High Wind (CF 40.0%)
        Deployment = Hybrid -> Returns Solar + Wind + Combined Total.
        """
        eval_result = {
            "solar_assessment": {"capacity_factor": 24.0},
            "wind_assessment": {"capacity_factor": 40.0}
        }
        res = self.service.estimate_energy(
            site_evaluation_result=eval_result,
            deployment_type="Hybrid",
            installed_capacity=1000.0
        )
        expected_solar = 2102400.0
        expected_wind = 3504000.0
        expected_total = 5606400.0

        assert res["solar_energy"] == expected_solar
        assert res["wind_energy"] == expected_wind
        assert res["total_energy"] == expected_total
        assert res["deployment_type"] == "Hybrid"


# ── FastAPI Endpoint Integration Test ────────────────────────────────────────

class TestEnergyEstimationEndpoint:
    def test_energy_estimate_endpoint(self):
        token = get_auth_token()
        payload = {
            "deployment_type": "Hybrid",
            "installed_capacity": 1000.0,
            "operating_hours": 8760.0,
            "solar_capacity_factor": 22.0,
            "wind_capacity_factor": 35.0
        }
        resp = client.post(
            "/assessment/energy-estimate",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["deployment_type"] == "Hybrid"
        assert data["solar_energy"] == 1927200.0
        assert data["wind_energy"] == 3066000.0
        assert data["total_energy"] == 4993200.0

    def test_energy_estimate_endpoint_invalid_input(self):
        token = get_auth_token()
        payload = {
            "deployment_type": "Solar",
            "installed_capacity": -500.0,
            "solar_capacity_factor": 20.0
        }
        resp = client.post(
            "/assessment/energy-estimate",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 400
        assert "Installed capacity cannot be negative" in resp.json()["detail"]
