"""
Weights Configuration Module for Site Suitability Score.
Manages configurable weight mappings for category-wise score aggregation.
"""

from typing import Dict, Any

# Configurable default weight mapping (totals 100%)
DEFAULT_WEIGHTS = {
    "renewable": 35,
    "terrain": 25,
    "infrastructure": 15,
    "environment": 15,
    "economic": 10
}


def get_weights(custom_weights: Dict[str, Any] = None) -> Dict[str, float]:
    """
    Retrieves weight mapping, merging custom weights with defaults if provided.
    
    Args:
        custom_weights: Optional dict containing category weights.
        
    Returns:
        Dict[str, float]: Validated weight mapping.
    """
    weights = DEFAULT_WEIGHTS.copy()

    if custom_weights:
        for key, val in custom_weights.items():
            k_lower = key.lower()
            if k_lower in weights:
                try:
                    weights[k_lower] = float(val)
                except (ValueError, TypeError):
                    pass

    return weights


def get_weight_category_name(overall_score: float) -> str:
    """
    Maps an overall site suitability score (0-100) to a qualitative category label.
    """
    if overall_score >= 85.0:
        return "Excellent"
    elif overall_score >= 70.0:
        return "Highly Suitable"
    elif overall_score >= 55.0:
        return "Moderately Suitable"
    elif overall_score >= 40.0:
        return "Low Suitability"
    else:
        return "Unsuitable"
