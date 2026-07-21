MAX_SLOPE = 30
MIN_SOLAR_IRRADIANCE = 5.0
MIN_WIND_SPEED = 6.0
MAX_GRID_DISTANCE = 10
MAX_ROAD_DISTANCE = 5


def check_slope(slope):
    return slope <= MAX_SLOPE


def check_solar(solar):
    return solar >= MIN_SOLAR_IRRADIANCE


def check_wind(wind):
    return wind >= MIN_WIND_SPEED


def check_grid_distance(distance):
    return distance <= MAX_GRID_DISTANCE


def check_road_distance(distance):
    return distance <= MAX_ROAD_DISTANCE