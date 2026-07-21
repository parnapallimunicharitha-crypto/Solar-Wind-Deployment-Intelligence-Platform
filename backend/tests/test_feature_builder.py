from app.feature_engineering.feature_builder import FeatureBuilder


def test_feature_builder():
    builder = FeatureBuilder()
    data = builder.build_features(13.6288, 79.4192)

    expected_fields = [
        "latitude", "longitude", "solar_irradiance", "wind_speed",
        "temperature", "humidity", "elevation", "slope",
        "road_distance", "substation_distance", "capacity_factor",
        "wind_class", "terrain_score", "accessibility_score"
    ]
    for field in expected_fields:
        assert field in data
        assert data[field] is not None
