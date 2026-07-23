"""
Investment Recommendation Service

Calculates financial performance metrics (CAPEX, OPEX, Annual Revenue, ROI, Payback, NPV, IRR, LCOE),
assesses investment risk, and generates actionable investment recommendations.
"""

from typing import Dict, Any, Optional


class InvestmentRecommendationService:
    """
    Service layer to calculate renewable energy project investment feasibility metrics
    and generate formal investment recommendations.
    """

    SOLAR_CAPEX_PER_KW = 900.0
    WIND_CAPEX_PER_KW = 1350.0
    HYBRID_CAPEX_PER_KW = 1100.0

    OPEX_RATIO_OF_CAPEX = 0.02  # 2% of CAPEX annually

    def calculate_investment_metrics(
        self,
        annual_energy_kwh: float,
        installed_capacity: float = 1000.0,
        deployment_type: str = "Hybrid",
        tariff_rate: float = 0.08,  # $/kWh
        project_lifetime_years: int = 25,
        discount_rate: float = 0.08  # 8%
    ) -> Dict[str, Any]:
        """
        Calculates financial metrics and investment recommendation.

        :param annual_energy_kwh: Annual energy yield forecast in kWh
        :param installed_capacity: Total capacity in kW
        :param deployment_type: "Solar", "Wind", or "Hybrid"
        :param tariff_rate: Electricity revenue tariff per kWh
        :param project_lifetime_years: Project design lifespan (default: 25 years)
        :param discount_rate: Annual discount rate (default: 8%)
        :return: Dict matching InvestmentRecommendationResponse schema
        """
        cap = max(10.0, float(installed_capacity or 1000.0))
        dep = (deployment_type or "Hybrid").capitalize()
        energy = max(0.0, float(annual_energy_kwh or 0.0))
        rate = max(0.01, float(tariff_rate or 0.08))
        lifetime = max(5, int(project_lifetime_years or 25))
        r = max(0.01, float(discount_rate or 0.08))

        # 1. CAPEX & OPEX
        unit_capex = (
            self.SOLAR_CAPEX_PER_KW if dep == "Solar" else
            self.WIND_CAPEX_PER_KW if dep == "Wind" else
            self.HYBRID_CAPEX_PER_KW
        )
        capex = round(cap * unit_capex, 2)
        opex = round(capex * self.OPEX_RATIO_OF_CAPEX, 2)

        # 2. Annual Revenue & Net Annual Cash Flow
        annual_revenue = round(energy * rate, 2)
        net_cash_flow = annual_revenue - opex

        # 3. Payback Period
        if net_cash_flow > 0:
            payback_period = round(capex / net_cash_flow, 2)
        else:
            payback_period = 99.0

        # 4. Return on Investment (ROI %) over lifetime
        total_lifetime_net = (net_cash_flow * lifetime) - capex
        if capex > 0:
            roi = round((total_lifetime_net / capex) * 100.0, 2)
        else:
            roi = 0.0

        # 5. Net Present Value (NPV)
        pv_cash_flows = sum(net_cash_flow / ((1.0 + r) ** t) for t in range(1, lifetime + 1))
        npv = round(pv_cash_flows - capex, 2)

        # 6. Internal Rate of Return (IRR %) via binary search
        irr = self._calculate_irr(capex, net_cash_flow, lifetime)

        # 7. Levelized Cost of Energy (LCOE $/kWh)
        pv_costs = capex + sum(opex / ((1.0 + r) ** t) for t in range(1, lifetime + 1))
        pv_energy = sum(energy / ((1.0 + r) ** t) for t in range(1, lifetime + 1))
        if pv_energy > 0:
            lcoe = round(pv_costs / pv_energy, 4)
        else:
            lcoe = 0.0

        # 8. Investment Risk & Recommendation Classification
        if payback_period <= 7.0 and irr >= 12.0:
            risk = "Low"
        elif payback_period <= 11.0 and irr >= 7.0:
            risk = "Medium"
        else:
            risk = "High"

        if payback_period <= 8.5 and npv > 0 and irr >= 10.0:
            recommendation = "Recommended"
        elif payback_period <= 13.0 and npv >= 0:
            recommendation = "Conditionally Recommended"
        else:
            recommendation = "Not Recommended"

        return {
            "capex": capex,
            "opex": opex,
            "annual_revenue": annual_revenue,
            "roi": roi,
            "payback_period": payback_period,
            "npv": npv,
            "irr": irr,
            "lcoe": lcoe,
            "investment_risk": risk,
            "investment_recommendation": recommendation
        }

    def _calculate_irr(self, capex: float, annual_cash_flow: float, lifetime: int) -> float:
        """Helper to calculate Internal Rate of Return (IRR %) using binary search."""
        if capex <= 0 or annual_cash_flow <= 0:
            return 0.0

        low = 0.0001
        high = 2.0  # 200% max IRR search bound

        for _ in range(50):
            mid = (low + high) / 2.0
            npv_val = sum(annual_cash_flow / ((1.0 + mid) ** t) for t in range(1, lifetime + 1)) - capex
            if abs(npv_val) < 1.0:
                return round(mid * 100.0, 2)
            if npv_val > 0:
                low = mid
            else:
                high = mid

        return round(mid * 100.0, 2)
