from services.wind_assessment import classify_wind_site
from services.deployment_strategy import (
    recommend_deployment,
    generate_reason,
    confidence_score,
)

# Sample Input
wind = classify_wind_site(6.4)
solar_class = "Excellent"

deployment = recommend_deployment(
    solar_class,
    wind["wind_class"]
)

result = {
    "deployment": deployment,
    "confidence": confidence_score(
        solar_class,
        wind["wind_class"]
    ),
    "reason": generate_reason(
        solar_class,
        wind["wind_class"]
    )
}

print("Wind Assessment:")
print(wind)

print("\nDeployment Recommendation:")
print(result)