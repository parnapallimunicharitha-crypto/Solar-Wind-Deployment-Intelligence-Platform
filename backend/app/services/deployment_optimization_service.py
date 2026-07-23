"""
Deployment Optimization Service

Provides constraint-based optimization for solar, wind, and hybrid renewable deployments.
Respects land area, budget limits, environmental restrictions, grid capacity,
infrastructure availability, transmission distance, and road accessibility.
"""

from typing import Dict, List, Optional, Any, Union


class DeploymentOptimizationService:
    """
    Service layer for optimizing renewable energy deployment parameters based on site assessment,
    ranking, resource availability, and operational constraints.
    """

    # Estimated land requirements in sq km per MW
    SOLAR_LAND_SQ_KM_PER_MW = 0.020  # ~2 hectares / MW
    WIND_LAND_SQ_KM_PER_MW = 0.060   # ~6 hectares / MW
    HYBRID_LAND_SQ_KM_PER_MW = 0.035 # ~3.5 hectares / MW

    # Estimated CAPEX cost per kW in baseline monetary units ($ / kW)
    SOLAR_CAPEX_PER_KW = 900.0
    WIND_CAPEX_PER_KW = 1350.0
    HYBRID_CAPEX_PER_KW = 1100.0

    def optimize_deployment(
        self,
        site_ranking_result: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None,
        overall_suitability_score: float = 75.0,
        solar_resource: float = 5.5,
        wind_resource: float = 6.2,
        terrain_score: float = 70.0,
        infrastructure_score: float = 65.0,
        environmental_score: float = 80.0,
        installed_capacity: float = 1000.0,  # kW
        deployment_type: str = "Hybrid",
        constraints: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Optimizes deployment capacity and renewable mix ratio subject to constraint parameters.

        :param site_ranking_result: Ranking dictionary or list of candidate site rankings
        :param overall_suitability_score: Composite suitability score (0-100)
        :param solar_resource: Daily solar irradiance (kWh/m²/d) or solar score
        :param wind_resource: Average wind speed (m/s) or wind score
        :param terrain_score: Terrain suitability score (0-100)
        :param infrastructure_score: Infrastructure accessibility score (0-100)
        :param environmental_score: Environmental score (0-100)
        :param installed_capacity: Baseline target capacity in kW
        :param deployment_type: Preferred or recommended deployment type ("Solar", "Wind", "Hybrid")
        :param constraints: Dictionary of constraint bounds (land area, budget, grid capacity, etc.)
        :return: Dict matching DeploymentOptimizationResponse schema
        """
        constraints_cfg = constraints or {}
        if hasattr(constraints_cfg, "dict"):
            constraints_cfg = constraints_cfg.dict(exclude_unset=True)

        target_capacity = max(10.0, float(installed_capacity or 1000.0))

        # Normalize resources to 0-100 scale for comparison
        solar_score_norm = min(100.0, solar_resource * 14.0) if solar_resource <= 10.0 else min(100.0, solar_resource)
        wind_score_norm = min(100.0, wind_resource * 12.5) if wind_resource <= 12.0 else min(100.0, wind_resource)

        # 1. Determine Recommended Deployment Type
        dep_type_input = (deployment_type or "Hybrid").capitalize()
        if dep_type_input not in ["Solar", "Wind", "Hybrid"]:
            dep_type_input = "Hybrid"

        if solar_score_norm > 65.0 and wind_score_norm > 65.0:
            rec_deployment = "Hybrid"
        elif solar_score_norm >= wind_score_norm + 15.0:
            rec_deployment = "Solar"
        elif wind_score_norm >= solar_score_norm + 15.0:
            rec_deployment = "Wind"
        else:
            rec_deployment = dep_type_input

        # 2. Determine Initial Renewable Mix & Split Ratios
        if rec_deployment == "Solar":
            solar_ratio = 1.0
            wind_ratio = 0.0
        elif rec_deployment == "Wind":
            solar_ratio = 0.0
            wind_ratio = 1.0
        else:
            # Hybrid mix proportion based on relative resource strength
            total_res = (solar_score_norm + wind_score_norm) or 1.0
            solar_ratio = round(solar_score_norm / total_res, 2)
            wind_ratio = round(1.0 - solar_ratio, 2)
            # Ensure reasonable bounds for hybrid (at least 20% each)
            if solar_ratio < 0.2:
                solar_ratio = 0.2
                wind_ratio = 0.8
            elif solar_ratio > 0.8:
                solar_ratio = 0.8
                wind_ratio = 0.2

        # 3. Evaluate Constraints & Capacity Bounds
        optimal_capacity = target_capacity
        violations: List[str] = []
        satisfaction_score = 100.0

        # Constraint 1: Grid Capacity (MW converted to kW if needed)
        grid_cap = constraints_cfg.get("grid_capacity")
        if grid_cap is not None and float(grid_cap) > 0:
            grid_cap_kw = float(grid_cap) * 1000.0 if float(grid_cap) <= 500.0 else float(grid_cap)
            if optimal_capacity > grid_cap_kw:
                violations.append(f"Grid capacity limit breached: target {optimal_capacity:.0f} kW exceeds grid max {grid_cap_kw:.0f} kW.")
                optimal_capacity = grid_cap_kw
                satisfaction_score -= 20.0

        # Constraint 2: Land Area Limit (sq km)
        max_land = constraints_cfg.get("max_land_area_sq_km")
        if max_land is not None and float(max_land) > 0:
            land_avail = float(max_land)
            land_per_mw = (
                self.SOLAR_LAND_SQ_KM_PER_MW if rec_deployment == "Solar" else
                self.WIND_LAND_SQ_KM_PER_MW if rec_deployment == "Wind" else
                self.HYBRID_LAND_SQ_KM_PER_MW
            )
            max_cap_land_kw = (land_avail / land_per_mw) * 1000.0
            if optimal_capacity > max_cap_land_kw:
                violations.append(f"Land area constraint breached: available land {land_avail:.2f} sq km supports max {max_cap_land_kw:.0f} kW.")
                optimal_capacity = min(optimal_capacity, max_cap_land_kw)
                satisfaction_score -= 25.0

        # Constraint 3: Budget Limit ($ or ₹)
        budget_limit = constraints_cfg.get("budget_limit")
        if budget_limit is not None and float(budget_limit) > 0:
            b_limit = float(budget_limit)
            unit_capex = (
                self.SOLAR_CAPEX_PER_KW if rec_deployment == "Solar" else
                self.WIND_CAPEX_PER_KW if rec_deployment == "Wind" else
                self.HYBRID_CAPEX_PER_KW
            )
            max_cap_budget_kw = b_limit / unit_capex
            if optimal_capacity > max_cap_budget_kw:
                violations.append(f"Budget limit breached: budget threshold limits deployment to {max_cap_budget_kw:.0f} kW.")
                optimal_capacity = min(optimal_capacity, max_cap_budget_kw)
                satisfaction_score -= 20.0

        # Constraint 4: Environmental Restrictions Score
        min_env = constraints_cfg.get("environmental_restrictions")
        if min_env is not None and float(min_env) > 0:
            req_env = float(min_env)
            if environmental_score < req_env:
                violations.append(f"Environmental restriction breached: site environmental score ({environmental_score:.1f}) is below minimum requirement ({req_env:.1f}).")
                satisfaction_score -= 25.0

        # Constraint 5: Infrastructure & Distance limits
        max_substation_dist = constraints_cfg.get("infrastructure_availability")
        if max_substation_dist is not None and float(max_substation_dist) > 0:
            if infrastructure_score < 40.0:
                violations.append("Infrastructure availability restricted: substation distance exceeds optimal range.")
                satisfaction_score -= 15.0

        max_trans_dist = constraints_cfg.get("transmission_distance")
        if max_trans_dist is not None and float(max_trans_dist) > 0:
            if float(max_trans_dist) < 5.0:
                violations.append("Transmission distance restriction: grid connection point is beyond threshold limit.")
                satisfaction_score -= 10.0

        max_road_dist = constraints_cfg.get("road_accessibility")
        if max_road_dist is not None and float(max_road_dist) > 0:
            if float(max_road_dist) < 2.0:
                violations.append("Road accessibility restriction: site access road distance exceeds limits.")
                satisfaction_score -= 10.0

        satisfaction_score = max(0.0, round(satisfaction_score, 1))
        optimal_capacity = max(10.0, round(optimal_capacity, 1))

        # 4. Calculate Final Capacities & Renewable Mix
        solar_capacity = round(optimal_capacity * solar_ratio, 1)
        wind_capacity = round(optimal_capacity * wind_ratio, 1)
        solar_pct = round(solar_ratio * 100.0, 1)
        wind_pct = round(wind_ratio * 100.0, 1)

        # 5. Determine Optimization Status & Feasibility
        is_feasible = (satisfaction_score >= 50.0) and (optimal_capacity >= 10.0)

        if not is_feasible:
            status = "Infeasible"
        elif len(violations) == 0:
            status = "Optimal"
        elif optimal_capacity >= target_capacity * 0.8:
            status = "Feasible"
        else:
            status = "Sub-optimal"

        # 6. Overall Optimization Score (0-100)
        suit_weight = 0.4
        satisfaction_weight = 0.4
        resource_weight = 0.2
        avg_res_score = (solar_score_norm + wind_score_norm) / 2.0

        overall_opt_score = round(
            (overall_suitability_score * suit_weight) +
            (satisfaction_score * satisfaction_weight) +
            (avg_res_score * resource_weight),
            1
        )
        overall_opt_score = max(0.0, min(100.0, overall_opt_score))

        return {
            "optimal_installed_capacity": optimal_capacity,
            "recommended_deployment_type": rec_deployment,
            "renewable_mix": {
                "solar_pct": solar_pct,
                "wind_pct": wind_pct
            },
            "overall_optimization_score": overall_opt_score,
            "constraint_satisfaction_score": satisfaction_score,
            "best_capacity": optimal_capacity,
            "solar_capacity": solar_capacity,
            "wind_capacity": wind_capacity,
            "hybrid_ratio": {
                "solar": solar_ratio,
                "wind": wind_ratio
            },
            "constraint_violations": violations if violations else ["No constraint violations"],
            "optimization_status": status,
            "feasible": is_feasible
        }
