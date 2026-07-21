from app.services.terrain_service import TerrainService


def test_terrain_service_get_terrain():
    service = TerrainService()
    data = service.get_terrain(13.6288, 79.4192)

    assert "elevation" in data
    assert "slope" in data
    assert "suitability" in data
    assert "score" in data
    assert isinstance(data["elevation"], float)
    assert isinstance(data["slope"], float)
    assert isinstance(data["suitability"], str)
    assert isinstance(data["score"], float)
