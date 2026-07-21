from app.services.wind_service import WindService


def test_wind_service_get_wind():
    service = WindService()
    data = service.get_wind(13.6288, 79.4192)

    assert "wind_speed" in data
    assert "wind_power_density" in data
    assert "wind_class" in data
    assert "capacity_factor" in data
    assert isinstance(data["wind_speed"], float)
    assert isinstance(data["wind_power_density"], float)
    assert isinstance(data["wind_class"], str)
    assert isinstance(data["capacity_factor"], float)
