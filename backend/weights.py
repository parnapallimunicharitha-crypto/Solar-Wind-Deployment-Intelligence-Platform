"""
Root wrapper for weights module.
Re-exports from app.services.weights for top-level import compatibility.
"""
from app.services.weights import (
    DEFAULT_WEIGHTS,
    get_weights,
    get_weight_category_name
)

__all__ = [
    "DEFAULT_WEIGHTS",
    "get_weights",
    "get_weight_category_name"
]
