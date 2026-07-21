def get_recommendation(score):

    if score >= 85:
        return "Highly Suitable"

    elif score >= 70:
        return "Suitable"

    elif score >= 50:
        return "Moderately Suitable"

    return "Not Recommended"