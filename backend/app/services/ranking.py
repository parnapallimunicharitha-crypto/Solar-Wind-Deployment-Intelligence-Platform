"""
Candidate Site Ranking Engine.
Evaluates, orders, ranks, and recommends candidate renewable energy sites dynamically.
Supports ranking for any number of sites (2 to 100+).
"""

from typing import List, Dict, Any, Optional
from app.services.scoring import calculateOverallScore


def rankCandidateSites(
    candidate_sites: List[Dict[str, Any]],
    weights: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """
    Ranks a list of candidate sites based on their Site Suitability Scores.
    
    Args:
        candidate_sites: List of site dictionaries. Each item must contain site metadata
                         and either pre-calculated category scores or raw feature values.
        weights: Optional dictionary of custom category weights.
        
    Returns:
        List[Dict[str, Any]]: Sorted list of sites with assigned rank, overall score,
                             and recommendation (highlighting Rank 1 as 'Best Recommended Site').
    """
    if not candidate_sites:
        return []

    evaluated_sites = []

    for idx, site in enumerate(candidate_sites):
        # Extract site identifier
        site_id = site.get("id") or site.get("site_id") or (idx + 1)
        site_name = site.get("site_name") or site.get("name") or f"Site #{site_id}"
        
        # Check if score breakdown is present or calculate dynamically
        if "overall_score" in site and "category" in site:
            overall_score = float(site["overall_score"])
            category = site["category"]
            r_score = float(site.get("renewable_resource_score", 0.0))
            t_score = float(site.get("terrain_score", 0.0))
            i_score = float(site.get("infrastructure_score", 0.0))
            env_score = float(site.get("environmental_score", 0.0))
            eco_score = float(site.get("economic_score", 0.0))
        elif "suitability_score" in site and isinstance(site["suitability_score"], dict):
            suit = site["suitability_score"]
            overall_score = float(suit.get("overall_score", 0.0))
            category = suit.get("category", "Unknown")
            r_score = float(suit.get("renewable_resource_score", 0.0))
            t_score = float(suit.get("terrain_score", 0.0))
            i_score = float(suit.get("infrastructure_score", 0.0))
            env_score = float(suit.get("environmental_score", 0.0))
            eco_score = float(suit.get("economic_score", 0.0))
        else:
            # Calculate overall score dynamically from scores dict
            scores_dict = {
                "renewable": float(site.get("renewable_resource_score", 0.0)),
                "terrain": float(site.get("terrain_score", 0.0)),
                "infrastructure": float(site.get("infrastructure_score", 0.0)),
                "environment": float(site.get("environmental_score", 0.0)),
                "economic": float(site.get("economic_score", 0.0))
            }
            res = calculateOverallScore(scores_dict, weights)
            overall_score = res["overall_score"]
            category = res["category"]
            r_score = res["renewable_resource_score"]
            t_score = res["terrain_score"]
            i_score = res["infrastructure_score"]
            env_score = res["environmental_score"]
            eco_score = res["economic_score"]

        evaluated_sites.append({
            "site_id": site_id,
            "site_name": site_name,
            "latitude": site.get("latitude"),
            "longitude": site.get("longitude"),
            "region": site.get("region", "N/A"),
            "renewable_resource_score": r_score,
            "terrain_score": t_score,
            "infrastructure_score": i_score,
            "environmental_score": env_score,
            "economic_score": eco_score,
            "overall_score": overall_score,
            "category": category,
            "original_index": idx
        })

    # Sort all sites in descending order of overall score
    ranked_sites = sorted(evaluated_sites, key=lambda s: s["overall_score"], reverse=True)

    # Assign sequential ranks and recommendations
    for rank, site in enumerate(ranked_sites, start=1):
        site["rank"] = rank
        if rank == 1:
            site["recommendation"] = "Best Recommended Site"
            site["is_best"] = True
        else:
            site["is_best"] = False
            if site["overall_score"] >= 80:
                site["recommendation"] = "Highly Recommended"
            elif site["overall_score"] >= 65:
                site["recommendation"] = "Recommended for Development"
            elif site["overall_score"] >= 50:
                site["recommendation"] = "Feasible with Infrastructure Upgrades"
            else:
                site["recommendation"] = "Not Recommended"

    return ranked_sites

# Aliases for pythonic naming conventions
rank_sites = rankCandidateSites
rank_candidate_sites = rankCandidateSites
