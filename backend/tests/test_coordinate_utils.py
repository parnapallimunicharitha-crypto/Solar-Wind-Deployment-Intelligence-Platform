from app.utils.coordinate_utils import (
    validate_coordinates,
    create_coordinate,
)


def test_valid_coordinates():
    assert validate_coordinates(13.6288, 79.4192) is True


def test_invalid_latitude():
    assert validate_coordinates(100.0, 79.4192) is False


def test_invalid_longitude():
    assert validate_coordinates(13.6288, 200.0) is False


def test_create_coordinate():
    coordinate = create_coordinate(13.6288, 79.4192)

    assert coordinate.latitude == 13.6288
    assert coordinate.longitude == 79.4192