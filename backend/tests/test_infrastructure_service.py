from app.services.infrastructure_service import InfrastructureService


def test_infrastructure_service_get_infrastructure():
    service = InfrastructureService()
    data = service.get_infrastructure(13.6288, 79.4192)

    assert "nearest_road" in data
    assert "nearest_substation" in data
    assert "transmission_line_distance" in data
    assert "accessibility_score" in data
    assert isinstance(data["nearest_road"], float)
    assert isinstance(data["nearest_substation"], float)
    assert isinstance(data["transmission_line_distance"], float)
    assert isinstance(data["accessibility_score"], float)
