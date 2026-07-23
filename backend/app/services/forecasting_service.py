"""
Forecasting Service

Generates annual, monthly, seasonal, capacity utilization, and revenue forecasts
for renewable energy deployment.
REUSES existing annual energy estimation logic from EnergyEstimationService.
"""

from typing import Dict, List, Optional, Any, Union
from app.services.energy_estimation_service import (
    EnergyEstimationService,
    calculate_solar_energy,
    calculate_wind_energy
)

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# Monthly distribution factors (seasonal variance) summing to 1.0
SOLAR_MONTHLY_FACTORS = [0.075, 0.082, 0.095, 0.098, 0.095, 0.080, 0.070, 0.072, 0.078, 0.085, 0.087, 0.083]
WIND_MONTHLY_FACTORS  = [0.065, 0.070, 0.080, 0.090, 0.110, 0.125, 0.130, 0.120, 0.085, 0.060, 0.062, 0.063]


class ForecastingService:
    """
    Forecasting Service layer to generate multi-dimensional energy yield & revenue predictions.
    Reuses existing annual energy estimation services.
    """

    def __init__(self):
        self.energy_service = EnergyEstimationService()

    def generate_forecast(
        self,
        installed_capacity: float = 1000.0,
        solar_capacity: Optional[float] = None,
        wind_capacity: Optional[float] = None,
        deployment_type: str = "Hybrid",
        solar_capacity_factor: float = 20.0,
        wind_capacity_factor: float = 35.0,
        tariff_rate: float = 0.08  # $/kWh or currency equivalent
    ) -> Dict[str, Any]:
        """
        Generates energy production and revenue forecasts.

        :param installed_capacity: Total installed capacity in kW
        :param solar_capacity: Solar capacity in kW (if None, derived from deployment_type)
        :param wind_capacity: Wind capacity in kW (if None, derived from deployment_type)
        :param deployment_type: "Solar", "Wind", or "Hybrid"
        :param solar_capacity_factor: Solar Capacity Factor % (0-100)
        :param wind_capacity_factor: Wind Capacity Factor % (0-100)
        :param tariff_rate: Feed-in tariff or PPA price per kWh
        :return: Dict matching ForecastingResponse schema
        """
        dep = (deployment_type or "Hybrid").capitalize()
        total_cap = float(installed_capacity or 1000.0)

        # Resolve component capacities
        if solar_capacity is not None and wind_capacity is not None:
            sol_cap = max(0.0, float(solar_capacity))
            wnd_cap = max(0.0, float(wind_capacity))
        else:
            if dep == "Solar":
                sol_cap, wnd_cap = total_cap, 0.0
            elif dep == "Wind":
                sol_cap, wnd_cap = 0.0, total_cap
            else:
                sol_cap = total_cap * 0.6
                wnd_cap = total_cap * 0.4

        sol_cf = float(solar_capacity_factor or 20.0)
        wnd_cf = float(wind_capacity_factor or 35.0)

        # 1. Reuse existing annual energy calculation logic
        annual_solar_kwh = calculate_solar_energy(sol_cap, sol_cf, 8760.0) if sol_cap > 0 else 0.0
        annual_wind_kwh = calculate_wind_energy(wnd_cap, wnd_cf, 8760.0) if wnd_cap > 0 else 0.0
        total_annual_kwh = round(annual_solar_kwh + annual_wind_kwh, 2)
        total_annual_mwh = round(total_annual_kwh / 1000.0, 2)

        # 2. Monthly Energy Forecast Breakdown
        monthly_forecast = []
        monthly_revenues = []

        for idx, month in enumerate(MONTHS):
            m_sol = round(annual_solar_kwh * SOLAR_MONTHLY_FACTORS[idx], 2)
            m_wnd = round(annual_wind_kwh * WIND_MONTHLY_FACTORS[idx], 2)
            m_tot = round(m_sol + m_wnd, 2)
            m_rev = round(m_tot * tariff_rate, 2)

            monthly_forecast.append({
                "month": month,
                "solar_energy_kwh": m_sol,
                "wind_energy_kwh": m_wnd,
                "total_energy_kwh": m_tot
            })
            monthly_revenues.append(m_rev)

        # 3. Seasonal Forecast (Spring: Mar-Apr, Summer: May-Jun, Monsoon: Jul-Oct, Winter: Nov-Feb)
        spring_kwh = round(sum(monthly_forecast[i]["total_energy_kwh"] for i in [2, 3]), 2)
        summer_kwh = round(sum(monthly_forecast[i]["total_energy_kwh"] for i in [4, 5]), 2)
        monsoon_kwh = round(sum(monthly_forecast[i]["total_energy_kwh"] for i in [6, 7, 8, 9]), 2)
        winter_kwh = round(sum(monthly_forecast[i]["total_energy_kwh"] for i in [10, 11, 0, 1]), 2)

        # 4. Capacity Utilization Forecast
        if total_cap > 0:
            overall_cf = round((total_annual_kwh / (total_cap * 8760.0)) * 100.0, 2)
        else:
            overall_cf = 0.0

        capacity_utilization = {
            "overall_capacity_factor": overall_cf,
            "solar_capacity_factor": round(sol_cf, 2),
            "wind_capacity_factor": round(wnd_cf, 2)
        }

        # 5. Revenue Forecast
        annual_revenue = round(total_annual_kwh * tariff_rate, 2)

        return {
            "annual_energy_forecast": total_annual_kwh,
            "annual_energy_mwh": total_annual_mwh,
            "monthly_energy_forecast": monthly_forecast,
            "seasonal_forecast": {
                "spring_kwh": spring_kwh,
                "summer_kwh": summer_kwh,
                "monsoon_kwh": monsoon_kwh,
                "winter_kwh": winter_kwh
            },
            "capacity_utilization_forecast": capacity_utilization,
            "revenue_forecast": {
                "annual_revenue": annual_revenue,
                "monthly_revenue": monthly_revenues,
                "tariff_rate": tariff_rate
            }
        }
