"""
Deployment Recommendation Module

This module decides whether a location is
better suited for Solar, Wind or Hybrid deployment.
"""


def recommend_deployment(
        solar_class: str,
        wind_class: str
) -> str:
    """
    Recommend deployment strategy.
    """

    if solar_class == "Excellent" and wind_class == "Excellent":
        return "Hybrid"

    if solar_class == "Excellent":
        return "Solar"

    if wind_class == "Excellent":
        return "Wind"

    if solar_class == "Good" and wind_class == "Good":
        return "Hybrid"

    if solar_class == "Good":
        return "Solar"

    if wind_class == "Good":
        return "Wind"

    return "Not Recommended"


def generate_reason(
        solar_class: str,
        wind_class: str
) -> str:
    """
    Explain recommendation.
    """

    deployment = recommend_deployment(
        solar_class,
        wind_class
    )

    reasons = {
        "Solar":
            "Solar irradiance is significantly stronger than wind resource.",

        "Wind":
            "Wind resource is stronger than available solar potential.",

        "Hybrid":
            "High solar irradiance and consistently strong wind resource.",

        "Not Recommended":
            "Neither solar nor wind resource is sufficient for deployment."
    }

    return reasons[deployment]


def confidence_score(
        solar_class: str,
        wind_class: str
) -> int:
    """
    Estimate recommendation confidence.
    """

    if solar_class == "Excellent" and wind_class == "Excellent":
        return 91

    if solar_class == "Excellent":
        return 88

    if wind_class == "Excellent":
        return 87

    if solar_class == "Good" or wind_class == "Good":
        return 75

    return 55


# ==========================================
# Improved / Extended Recommendation Wrapper
# ==========================================

def recommend_strategy(solar_suitability: str, wind_suitability: str) -> dict:
    """
    Produce deployment recommendation including category, confidence, and reasoning.
    """
    def map_to_class(suitability: str) -> str:
        if suitability == "Excellent":
            return "Excellent"
        if suitability in ["Highly Suitable", "Moderately Suitable", "Good"]:
            return "Good"
        return "Poor"

    s_class = map_to_class(solar_suitability)
    w_class = map_to_class(wind_suitability)

    dep = recommend_deployment(s_class, w_class)
    conf = confidence_score(s_class, w_class)
    reason = generate_reason(s_class, w_class)

    return {
        "deployment": dep,
        "confidence": conf,
        "reason": reason
    }