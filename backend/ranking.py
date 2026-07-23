"""
Root wrapper for ranking module.
Re-exports from app.services.ranking for top-level import compatibility.
"""
from app.services.ranking import (
    rankCandidateSites,
    rank_sites,
    rank_candidate_sites
)

__all__ = [
    "rankCandidateSites",
    "rank_sites",
    "rank_candidate_sites"
]
