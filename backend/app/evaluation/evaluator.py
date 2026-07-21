from app.evaluation.constraints import *
from app.evaluation.scorer import calculate_score
from app.evaluation.recommendation import get_recommendation


class Evaluator:

    def evaluate(self, features):

        constraints = {
            "Slope": check_slope(features["slope"]),
            "Solar": check_solar(features["solar"]),
            "Wind": check_wind(features["wind"]),
            "Grid Distance": check_grid_distance(features["grid_distance"]),
            "Road Distance": check_road_distance(features["road_distance"]),
        }

        failed = []

        for name, status in constraints.items():
            if not status:
                failed.append(name)

        score = calculate_score(features)

        recommendation = get_recommendation(score)

        return {
            "constraints": constraints,
            "score": score,
            "recommendation": recommendation,
            "failed_constraints": failed
        }


if __name__ == "__main__":

    features = {
        "solar": 90,
        "wind": 80,
        "slope": 15,
        "grid_distance": 5,
        "road_distance": 3
    }

    evaluator = Evaluator()

    result = evaluator.evaluate(features)

    print(result)