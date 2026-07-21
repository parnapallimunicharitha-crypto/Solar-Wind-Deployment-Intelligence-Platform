from dataclasses import dataclass


@dataclass
class Coordinate:
    latitude: float
    longitude: float


def validate_coordinates(latitude, longitude):
    """
    Validate latitude and longitude.
    """
    if -90 <= latitude <= 90 and -180 <= longitude <= 180:
        return True
    return False


def create_coordinate(latitude, longitude):
    """
    Convert latitude and longitude into a Coordinate object.
    """
    if not validate_coordinates(latitude, longitude):
        raise ValueError("Invalid Coordinates")

    return Coordinate(latitude, longitude)


if __name__ == "__main__":
    print(validate_coordinates(13.6288, 79.4192))
    print(create_coordinate(13.6288, 79.4192))