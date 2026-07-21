from typing import Dict


def calculate_peak_sun_hours(solar_irradiance: float) -> float:
    """
    Numerically, daily solar irradiance in kWh/m2/day is equivalent to peak sun hours.
    """
    return round(solar_irradiance, 2)


def calculate_performance_ratio(temperature: float) -> float:
    """
    Estimate system performance ratio, accounting for high-temperature degradation.
    """
    # Base performance ratio of 82%
    base_pr = 0.82
    temp_coefficient = -0.004  # -0.4% efficiency loss per degree above 25°C
    base_temp = 25.0

    if temperature > base_temp:
        pr = base_pr + (temperature - base_temp) * temp_coefficient
    else:
        pr = base_pr

    # Clamp PR between 60% and 90%
    return round(max(0.60, min(0.90, pr)), 2)


def calculate_solar_capacity_factor(peak_sun_hours: float, performance_ratio: float) -> float:
    """
    Calculate solar PV capacity factor (%) based on peak sun hours and performance ratio.
    """
    cf = (peak_sun_hours * performance_ratio / 24.0) * 100
    return round(cf, 2)


def calculate_expected_energy_output(peak_sun_hours: float, performance_ratio: float) -> float:
    """
    Calculate expected annual energy output per kW of installed capacity (kWh/kWp/year).
    """
    return round(365.0 * peak_sun_hours * performance_ratio, 2)


def calculate_solar_suitability(solar_irradiance: float, slope: float) -> Dict:
    """
    Score and classify solar suitability based on solar resource and terrain slope.
    """
    # Assuming 8.0 kWh/m2/day is maximum solar irradiance benchmark
    resource_score = (solar_irradiance / 8.0) * 100
    # Slope penalty: flat or minor slope is ideal for solar panels
    slope_penalty = slope * 2.5

    solar_score = max(0.0, min(100.0, resource_score - slope_penalty))

    if solar_score >= 85:
        category = "Excellent"
    elif solar_score >= 70:
        category = "Highly Suitable"
    elif solar_score >= 55:
        category = "Moderately Suitable"
    elif solar_score >= 40:
        category = "Low Suitability"
    else:
        category = "Unsuitable"

    return {
        "score": round(solar_score, 2),
        "category": category
    }


def assess_solar(solar_irradiance: float, temperature: float, slope: float) -> Dict:
    """
    Execute full solar resource assessment.
    """
    psh = calculate_peak_sun_hours(solar_irradiance)
    pr = calculate_performance_ratio(temperature)
    cf = calculate_solar_capacity_factor(psh, pr)
    energy = calculate_expected_energy_output(psh, pr)
    suitability = calculate_solar_suitability(solar_irradiance, slope)
    annual_irradiance = round(solar_irradiance * 365.0, 2)

    return {
        "annual_irradiance": annual_irradiance,
        "expected_energy_output": energy,
        "peak_sun_hours": psh,
        "capacity_factor": cf,
        "performance_ratio": pr,
        "solar_suitability_score": suitability["score"],
        "solar_suitability": suitability["category"]
    }

