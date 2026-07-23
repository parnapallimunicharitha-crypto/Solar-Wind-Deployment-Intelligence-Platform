# Energy Estimation Module - Validation Report

**Date:** July 22, 2026  
**Module:** Energy Estimation Module (`calculate_solar_energy`, `calculate_wind_energy`, `EnergyEstimationService`)  
**Status:** ✅ Fully Validated & Production-Ready

---

## 1. Overview

The Energy Estimation Module provides automated, configurable annual energy yield calculations for Solar, Wind, and Hybrid renewable energy deployments.

The formulas used for annual energy yield ($E_{\text{annual}}$ in kWh) are:

$$\text{Solar Annual Energy (kWh)} = P_{\text{installed}} \times \text{CF}_{\text{solar}} \times H_{\text{operating}}$$

$$\text{Wind Annual Energy (kWh)} = P_{\text{installed}} \times \text{CF}_{\text{wind}} \times H_{\text{operating}}$$

$$\text{Hybrid Total Energy (kWh)} = E_{\text{solar}} + E_{\text{wind}}$$

Where:
- $P_{\text{installed}}$: Installed Capacity (kW)
- $\text{CF}$: Capacity Factor (0.0 to 1.0 or 0% to 100%)
- $H_{\text{operating}}$: Operating Hours per year (configurable parameter with default = 8760.0 hours)

---

## 2. Sample Sites Validation

| Parameter | Site A (High Solar, Low Wind) | Site B (Medium Solar, High Wind) | Site C (Hybrid Potential) |
| :--- | :--- | :--- | :--- |
| **Solar Irradiance / CF** | High ($\text{CF}_{\text{solar}} = 25.0\%$) | Medium ($\text{CF}_{\text{solar}} = 18.0\%$) | High ($\text{CF}_{\text{solar}} = 24.0\%$) |
| **Wind Speed / CF** | Low ($\text{CF}_{\text{wind}} = 10.0\%$) | High ($\text{CF}_{\text{wind}} = 45.0\%$) | High ($\text{CF}_{\text{wind}} = 40.0\%$) |
| **Installed Capacity** | $1,000\text{ kW}$ | $1,000\text{ kW}$ | $1,000\text{ kW}$ |
| **Operating Hours** | $8,760\text{ hrs/yr}$ | $8,760\text{ hrs/yr}$ | $8,760\text{ hrs/yr}$ |
| **Deployment Recommendation** | **Solar** | **Wind** | **Hybrid** |
| **Estimated Solar Energy** | $2,190,000\text{ kWh/yr}$ | $0\text{ kWh/yr}$ | $2,102,400\text{ kWh/yr}$ ($37.5\%$) |
| **Estimated Wind Energy** | $0\text{ kWh/yr}$ | $3,942,000\text{ kWh/yr}$ | $3,504,000\text{ kWh/yr}$ ($62.5\%$) |
| **Estimated Total Energy** | **$2,190,000\text{ kWh/yr}$** | **$3,942,000\text{ kWh/yr}$** | **$5,606,400\text{ kWh/yr}$** |

---

## 3. Core Verification Rules Checklist

| Verification Rule | Criteria | Result | Details |
| :--- | :--- | :--- | :--- |
| **Rule 1: Higher Capacity Factor** | Higher capacity factor produces higher annual energy output. | ✅ PASS | Verified for Solar ($15\% \to 25\%$) and Wind ($20\% \to 45\%$). |
| **Rule 2: Larger Installed Capacity** | Larger installed capacity produces larger annual energy output. | ✅ PASS | Verified for Solar & Wind ($500\text{ kW} \to 2000\text{ kW}$). |
| **Rule 3: Hybrid Total Calculation** | Total Hybrid Energy equals Solar Energy + Wind Energy. | ✅ PASS | $E_{\text{total}} = 2,102,400 + 3,504,000 = 5,606,400\text{ kWh/yr}$. |
| **Input Validation** | Negative values or factors $>100\%$ are rejected with `ValueError`. | ✅ PASS | Negative capacity, negative hours, and invalid capacity factors correctly raise exceptions. |
| **Configurable Operating Hours** | `operating_hours` parameter is configurable and not hardcoded to 8760. | ✅ PASS | Tested with custom operating hours (e.g. 4380 hrs and 8000 hrs). |

---

## 4. Automated Test Results

- **Test Suite File:** `backend/tests/test_energy_estimation.py`
- **Total Test Cases:** 18
- **Passed:** 18
- **Failed:** 0
- **Execution Time:** ~3.04 seconds

---

## 5. API & Frontend Integration

- **FastAPI Endpoint:** `POST /assessment/energy-estimate`
- **Response Schema:** `EnergyEstimationResponse` (`solar_energy`, `wind_energy`, `total_energy`, `deployment_type`, `installed_capacity`, `capacity_factor_used`, `operating_hours`)
- **Frontend Page:** `Assessment.jsx` & `AssessmentDisplay.jsx`
- **UI Card:** "⚡ Energy Estimation & Hybrid Analysis" rendering Estimated Total Annual Energy, Solar Contribution, Wind Contribution, Combined Energy, and Resource Split Bar.
