"""
Validation Engine for Site Assessment Engine.
Executes 7 automated test suites verifying normalization, category scoring,
overall dynamic suitability calculation, site ranking, and deterministic consistency.
"""

from typing import List, Dict, Any
from app.services.normalization import (
    normalize_solar_irradiance,
    normalize_wind_speed,
    normalize_slope,
    normalize_distance_to_grid,
    normalize_distance_to_road
)
from app.services.scoring import (
    calculateRenewableScore,
    calculateTerrainScore,
    calculateInfrastructureScore,
    calculateEnvironmentalScore,
    calculateEconomicScore,
    calculateOverallScore
)
from app.services.ranking import rankCandidateSites


class ValidationRunner:
    """
    Automated validator executing Task 5 test cases and producing formatted reports.
    """

    def __init__(self):
        self.results: List[Dict[str, Any]] = []

    def run_all_tests(self) -> List[Dict[str, Any]]:
        self.results = []

        # ── Test 1: Higher Solar Irradiance increases Renewable Score ─────────
        try:
            sol_low_norm = normalize_solar_irradiance(3.0)
            sol_high_norm = normalize_solar_irradiance(8.0)
            w_norm = normalize_wind_speed(5.0)

            score_low = calculateRenewableScore(sol_low_norm, w_norm)
            score_high = calculateRenewableScore(sol_high_norm, w_norm)

            passed = score_high > score_low
            self.results.append({
                "id": 1,
                "name": "Higher Solar Irradiance increases Renewable Score",
                "expected": f"Score at 8.0 kWh/m² ({score_high}) > Score at 3.0 kWh/m² ({score_low})",
                "actual": f"Low: {score_low}, High: {score_high}",
                "status": "PASS" if passed else "FAIL"
            })
        except Exception as e:
            self.results.append({
                "id": 1,
                "name": "Higher Solar Irradiance increases Renewable Score",
                "expected": "Renewable Score increases with solar irradiance",
                "actual": f"Error: {str(e)}",
                "status": "FAIL"
            })

        # ── Test 2: Higher Wind Speed increases Renewable Score ───────────────
        try:
            wind_low_norm = normalize_wind_speed(3.0)
            wind_high_norm = normalize_wind_speed(12.0)
            s_norm = normalize_solar_irradiance(5.0)

            score_low = calculateRenewableScore(s_norm, wind_low_norm)
            score_high = calculateRenewableScore(s_norm, wind_high_norm)

            passed = score_high > score_low
            self.results.append({
                "id": 2,
                "name": "Higher Wind Speed increases Renewable Score",
                "expected": f"Score at 12.0 m/s ({score_high}) > Score at 3.0 m/s ({score_low})",
                "actual": f"Low: {score_low}, High: {score_high}",
                "status": "PASS" if passed else "FAIL"
            })
        except Exception as e:
            self.results.append({
                "id": 2,
                "name": "Higher Wind Speed increases Renewable Score",
                "expected": "Renewable Score increases with wind speed",
                "actual": f"Error: {str(e)}",
                "status": "FAIL"
            })

        # ── Test 3: Poor Infrastructure reduces Infrastructure Score ─────────
        try:
            road_near = normalize_distance_to_road(2.0)
            grid_near = normalize_distance_to_grid(5.0)
            road_far = normalize_distance_to_road(25.0)
            grid_far = normalize_distance_to_grid(45.0)

            score_good = calculateInfrastructureScore(road_near, grid_near)
            score_poor = calculateInfrastructureScore(road_far, grid_far)

            passed = score_poor < score_good
            self.results.append({
                "id": 3,
                "name": "Poor Infrastructure reduces Infrastructure Score",
                "expected": f"Far Infra Score ({score_poor}) < Near Infra Score ({score_good})",
                "actual": f"Good: {score_good}, Poor: {score_poor}",
                "status": "PASS" if passed else "FAIL"
            })
        except Exception as e:
            self.results.append({
                "id": 3,
                "name": "Poor Infrastructure reduces Infrastructure Score",
                "expected": "Infrastructure Score decreases with distance",
                "actual": f"Error: {str(e)}",
                "status": "FAIL"
            })

        # ── Test 4: Steeper Terrain reduces Terrain Score ──────────────────────
        try:
            slope_flat_norm = normalize_slope(2.0)
            slope_steep_norm = normalize_slope(25.0)

            score_flat = calculateTerrainScore(slope_flat_norm, elevation=300)
            score_steep = calculateTerrainScore(slope_steep_norm, elevation=300)

            passed = score_steep < score_flat
            self.results.append({
                "id": 4,
                "name": "Steeper Terrain reduces Terrain Score",
                "expected": f"Steep Terrain Score ({score_steep}) < Flat Terrain Score ({score_flat})",
                "actual": f"Flat (2°): {score_flat}, Steep (25°): {score_steep}",
                "status": "PASS" if passed else "FAIL"
            })
        except Exception as e:
            self.results.append({
                "id": 4,
                "name": "Steeper Terrain reduces Terrain Score",
                "expected": "Terrain Score decreases with steeper slope",
                "actual": f"Error: {str(e)}",
                "status": "FAIL"
            })

        # ── Test 5: Changing input parameters changes Overall Score correctly ──
        try:
            scores_a = {"renewable": 90, "terrain": 85, "infrastructure": 80, "environment": 85, "economic": 80}
            scores_b = {"renewable": 40, "terrain": 35, "infrastructure": 30, "environment": 45, "economic": 30}

            res_a = calculateOverallScore(scores_a)
            res_b = calculateOverallScore(scores_b)

            passed = res_a["overall_score"] > res_b["overall_score"] and res_a["overall_score"] != res_b["overall_score"]
            self.results.append({
                "id": 5,
                "name": "Changing input parameters changes Overall Score correctly",
                "expected": f"High Parameters Score ({res_a['overall_score']}) > Low Parameters Score ({res_b['overall_score']})",
                "actual": f"Config A: {res_a['overall_score']} ({res_a['category']}), Config B: {res_b['overall_score']} ({res_b['category']})",
                "status": "PASS" if passed else "FAIL"
            })
        except Exception as e:
            self.results.append({
                "id": 5,
                "name": "Changing input parameters changes Overall Score correctly",
                "expected": "Overall Score responds dynamically to category inputs",
                "actual": f"Error: {str(e)}",
                "status": "FAIL"
            })

        # ── Test 6: Changing scores updates Ranking correctly ────────────────
        try:
            sites = [
                {"id": 1, "name": "Site Alpha", "renewable_resource_score": 60, "terrain_score": 60, "infrastructure_score": 60, "environmental_score": 60, "economic_score": 60},
                {"id": 2, "name": "Site Beta", "renewable_resource_score": 90, "terrain_score": 90, "infrastructure_score": 90, "environmental_score": 90, "economic_score": 90}
            ]
            ranked_initial = rankCandidateSites(sites)
            initial_top = ranked_initial[0]["site_name"]

            # Update site Alpha to have much higher scores
            sites_updated = [
                {"id": 1, "name": "Site Alpha", "renewable_resource_score": 98, "terrain_score": 98, "infrastructure_score": 98, "environmental_score": 98, "economic_score": 98},
                {"id": 2, "name": "Site Beta", "renewable_resource_score": 90, "terrain_score": 90, "infrastructure_score": 90, "environmental_score": 90, "economic_score": 90}
            ]
            ranked_updated = rankCandidateSites(sites_updated)
            updated_top = ranked_updated[0]["site_name"]

            passed = (initial_top == "Site Beta") and (updated_top == "Site Alpha") and (ranked_updated[0]["recommendation"] == "Best Recommended Site")
            self.results.append({
                "id": 6,
                "name": "Changing scores updates Ranking correctly",
                "expected": "Top ranked site switches from Site Beta to Site Alpha upon score update",
                "actual": f"Initial Rank #1: {initial_top}, Updated Rank #1: {updated_top} ({ranked_updated[0]['recommendation']})",
                "status": "PASS" if passed else "FAIL"
            })
        except Exception as e:
            self.results.append({
                "id": 6,
                "name": "Changing scores updates Ranking correctly",
                "expected": "Ranking updates dynamically when scores change",
                "actual": f"Error: {str(e)}",
                "status": "FAIL"
            })

        # ── Test 7: Repeated calculations with identical inputs produce identical outputs
        try:
            sample_input = {
                "solar": 6.8, "wind": 8.2, "slope": 4.5, "elevation": 420.0,
                "grid_dist": 12.0, "road_dist": 3.5, "cloud_cover": 18.0
            }

            def run_pipeline(inp):
                sol_n = normalize_solar_irradiance(inp["solar"])
                wnd_n = normalize_wind_speed(inp["wind"])
                slp_n = normalize_slope(inp["slope"])
                grd_n = normalize_distance_to_grid(inp["grid_dist"])
                rd_n = normalize_distance_to_road(inp["road_dist"])

                ren = calculateRenewableScore(sol_n, wnd_n)
                ter = calculateTerrainScore(slp_n, inp["elevation"])
                inf = calculateInfrastructureScore(rd_n, grd_n)
                env = calculateEnvironmentalScore(inp["cloud_cover"])
                eco = calculateEconomicScore(grd_n, rd_n)

                return calculateOverallScore({
                    "renewable": ren, "terrain": ter, "infrastructure": inf,
                    "environment": env, "economic": eco
                })

            res1 = run_pipeline(sample_input)
            res2 = run_pipeline(sample_input)

            passed = (res1 == res2)
            self.results.append({
                "id": 7,
                "name": "Repeated calculations with identical inputs produce identical outputs",
                "expected": "Run 1 output == Run 2 output (Deterministic)",
                "actual": f"Run 1: {res1['overall_score']}, Run 2: {res2['overall_score']} (Match: {res1 == res2})",
                "status": "PASS" if passed else "FAIL"
            })
        except Exception as e:
            self.results.append({
                "id": 7,
                "name": "Repeated calculations with identical inputs produce identical outputs",
                "expected": "Deterministic identical outputs",
                "actual": f"Error: {str(e)}",
                "status": "FAIL"
            })

        return self.results

    def generate_report(self) -> str:
        if not self.results:
            self.run_all_tests()

        report_lines = [
            "==========================================================================================================",
            "                                SITE ASSESSMENT ENGINE VALIDATION REPORT                                  ",
            "==========================================================================================================",
            f"{'Status':<8} | {'Test Name':<55} | {'Actual Result':<35}",
            "----------------------------------------------------------------------------------------------------------"
        ]

        all_passed = True
        for r in self.results:
            symbol = "PASS" if r["status"] == "PASS" else "FAIL"
            status_str = f"[{symbol}]"
            if r["status"] != "PASS":
                all_passed = False
            report_lines.append(f"{status_str:<8} | {r['name']:<55} | {r['actual']:<35}")

        report_lines.append("----------------------------------------------------------------------------------------------------------")
        report_lines.append(f"SUMMARY: {'ALL TESTS PASSED SUCCESSFULLY! [PASS]' if all_passed else 'SOME TESTS FAILED [FAIL]'}")
        report_lines.append("==========================================================================================================")

        return "\n".join(report_lines)


def run_validation():
    runner = ValidationRunner()
    results = runner.run_all_tests()
    report = runner.generate_report()
    print(report)
    return results, report


if __name__ == "__main__":
    run_validation()
