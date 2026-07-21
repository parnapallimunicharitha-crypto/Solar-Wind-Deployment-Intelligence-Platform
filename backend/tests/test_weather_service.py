from app.services.weather_service import WeatherService


def test_weather_service_get_weather():
    service = WeatherService()
    # Query coordinates
    data = service.get_weather(13.6288, 79.4192)

    assert "solar_irradiance" in data
    assert "temperature" in data
    assert "humidity" in data
    assert "rainfall" in data
    assert "cloud_cover" in data
    assert isinstance(data["solar_irradiance"], float)
    assert isinstance(data["temperature"], float)
    assert isinstance(data["humidity"], float)
    assert isinstance(data["rainfall"], float)
    assert isinstance(data["cloud_cover"], float)
