"""
Task 5: Scoring Engine Validation Tests.
Validates solar, wind, road, grid, slope, candidate site ranking, and deterministic repeatability.
"""

import pytest
from app.services.site_suitability_service import SiteSuitabilityService
from app.services.normalization import (
    normalize_solar_irradiance,
    normalize_wind_speed,
    normalize_slope,
    normalize_distance_to_grid,
    normalize_distance_to_road
)
from app.services.scoring import (
    calculateRenewableScore,
    calculateTerrainScore,
    calculateInfrastructureScore,
    calculateEnvironmentalScore,
    calculateEconomicScore,
    calculateOverallSuitability
)
from app.services.ranking import rankCandidateSites


@pytest.fixture
def service():
    return SiteSuitabilityService()


def test_solar_score(service):
    """
    Test 1: Higher Solar Irradiance increases Overall Score.
    """
    site_low_solar = service.assess_suitability_from_features(
        solar_irradiance=3.0,
        wind_speed=5.0,
        temperature=25.0,
        slope=2.0,
        road_distance=5.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    site_high_solar = service.assess_suitability_from_features(
        solar_irradiance=9.0,
        wind_speed=5.0,
        temperature=25.0,
        slope=2.0,
        road_distance=5.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    assert site_high_solar["overall_score"] > site_low_solar["overall_score"]


def test_wind_score(service):
    """
    Test 2: Higher Wind Speed increases Overall Score.
    """
    site_low_wind = service.assess_suitability_from_features(
        solar_irradiance=5.0,
        wind_speed=3.0,
        temperature=25.0,
        slope=2.0,
        road_distance=5.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    site_high_wind = service.assess_suitability_from_features(
        solar_irradiance=5.0,
        wind_speed=12.0,
        temperature=25.0,
        slope=2.0,
        road_distance=5.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    assert site_high_wind["overall_score"] > site_low_wind["overall_score"]


def test_road_score(service):
    """
    Test 3: Poor Road Accessibility decreases Overall Score.
    """
    near_road_site = service.assess_suitability_from_features(
        solar_irradiance=6.0,
        wind_speed=6.0,
        temperature=25.0,
        slope=2.0,
        road_distance=2.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    far_road_site = service.assess_suitability_from_features(
        solar_irradiance=6.0,
        wind_speed=6.0,
        temperature=25.0,
        slope=2.0,
        road_distance=50.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    assert near_road_site["overall_score"] > far_road_site["overall_score"]
    assert near_road_site["infrastructure_score"] > far_road_site["infrastructure_score"]


def test_grid_score(service):
    """
    Test 4: Poor Grid Connectivity decreases Overall Score.
    """
    near_grid_site = service.assess_suitability_from_features(
        solar_irradiance=6.0,
        wind_speed=6.0,
        temperature=25.0,
        slope=2.0,
        road_distance=5.0,
        substation_distance=5.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    far_grid_site = service.assess_suitability_from_features(
        solar_irradiance=6.0,
        wind_speed=6.0,
        temperature=25.0,
        slope=2.0,
        road_distance=5.0,
        substation_distance=80.0,
        cloud_cover=20.0,
        latitude=15.0
    )

    assert near_grid_site["overall_score"] > far_grid_site["overall_score"]
    assert near_grid_site["infrastructure_score"] > far_grid_site["infrastructure_score"]


def test_slope_score(service):
    """
    Test 5: Terrain Slope affects Terrain Score correctly.
    """
    flat_site = service.assess_suitability_from_features(
        solar_irradiance=6.0,
        wind_speed=6.0,
        temperature=25.0,
        slope=1.0,
        road_distance=5.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0,
        elevation=200.0
    )

    steep_site = service.assess_suitability_from_features(
        solar_irradiance=6.0,
        wind_speed=6.0,
        temperature=25.0,
        slope=30.0,
        road_distance=5.0,
        substation_distance=10.0,
        cloud_cover=20.0,
        latitude=15.0,
        elevation=200.0
    )

    assert flat_site["terrain_score"] > steep_site["terrain_score"]
    assert flat_site["overall_score"] > steep_site["overall_score"]


def test_ranking_update(service):
    """
    Test 6: Ranking changes when site parameters change.
    """
    site_a = service.assess_suitability_from_features(
        solar_irradiance=5.0, wind_speed=5.0, temperature=25.0,
        slope=5.0, road_distance=10.0, substation_distance=15.0
    )
    site_a["id"] = 1
    site_a["site_name"] = "Site A"

    site_b = service.assess_suitability_from_features(
        solar_irradiance=8.5, wind_speed=8.5, temperature=25.0,
        slope=2.0, road_distance=2.0, substation_distance=5.0
    )
    site_b["id"] = 2
    site_b["site_name"] = "Site B"

    site_c = service.assess_suitability_from_features(
        solar_irradiance=2.0, wind_speed=2.0, temperature=25.0,
        slope=15.0, road_distance=25.0, substation_distance=30.0
    )
    site_c["id"] = 3
    site_c["site_name"] = "Site C"

    initial_ranking = rankCandidateSites([site_a, site_b, site_c])
    assert initial_ranking[0]["site_name"] == "Site B"
    assert initial_ranking[0]["is_best"] is True
    assert initial_ranking[0]["recommendation"] == "Best Recommended Site"

    # Now modify Site C with high solar & high wind and updated parameters
    updated_site_c = service.assess_suitability_from_features(
        solar_irradiance=9.8, wind_speed=13.5, temperature=25.0,
        slope=1.0, road_distance=1.0, substation_distance=2.0
    )
    updated_site_c["id"] = 3
    updated_site_c["site_name"] = "Site C"

    updated_ranking = rankCandidateSites([site_a, site_b, updated_site_c])
    assert updated_ranking[0]["site_name"] == "Site C"
    assert updated_ranking[0]["is_best"] is True
    assert updated_ranking[0]["recommendation"] == "Best Recommended Site"


def test_repeatability(service):
    """
    Test 7: Repeated calculations are deterministic and produces identical outputs.
    """
    res1 = service.assess_suitability_from_features(
        solar_irradiance=6.5,
        wind_speed=7.8,
        temperature=26.5,
        slope=3.5,
        road_distance=4.2,
        substation_distance=11.0,
        cloud_cover=18.0,
        latitude=14.5
    )

    res2 = service.assess_suitability_from_features(
        solar_irradiance=6.5,
        wind_speed=7.8,
        temperature=26.5,
        slope=3.5,
        road_distance=4.2,
        substation_distance=11.0,
        cloud_cover=18.0,
        latitude=14.5
    )

    assert res1 == res2
    assert res1["overall_score"] == res2["overall_score"]
