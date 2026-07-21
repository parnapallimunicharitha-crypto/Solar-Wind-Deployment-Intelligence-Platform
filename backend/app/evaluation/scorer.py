from app.evaluation.weights import *


def calculate_score(features):
    score = (
        features["solar"] * SOLAR_WEIGHT +
        features["wind"] * WIND_WEIGHT +
        features["slope"] * SLOPE_WEIGHT +
        features["grid_distance"] * GRID_WEIGHT +
        features["road_distance"] * ROAD_WEIGHT
    )

    return score