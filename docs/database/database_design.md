# Database Design

## Database

PostgreSQL + PostGIS

---

## Table: Users

Primary Key:
user_id

Columns:

- user_id
- full_name
- email
- password
- role
- created_at

---

## Table: Projects

Primary Key:
project_id

Columns:

- project_id
- project_name
- description
- created_by
- start_date
- end_date
- status

---

## Table: Sites

Primary Key:
site_id

Columns:

- site_id
- project_id
- latitude
- longitude
- region
- land_area
- elevation
- land_ownership

---

## Table: EnvironmentalData

Primary Key:
environment_id

Columns:

- environment_id
- site_id
- solar_irradiance
- wind_speed
- wind_direction
- temperature
- rainfall
- humidity
- cloud_cover

---

## Table: SolarPrediction

Primary Key:
solar_prediction_id

Columns:

- solar_prediction_id
- site_id
- annual_energy
- peak_sun_hours
- capacity_factor
- performance_ratio
- prediction_date

---

## Table: WindPrediction

Primary Key:
wind_prediction_id

Columns:

- wind_prediction_id
- site_id
- average_wind_speed
- wind_power_density
- annual_energy
- capacity_factor
- prediction_date

---

## Table: SuitabilityScore

Primary Key:
score_id

Columns:

- score_id
- site_id
- solar_score
- wind_score
- infrastructure_score
- economic_score
- overall_score
- category

---

## Table: Reports

Primary Key:
report_id

Columns:

- report_id
- project_id
- report_name
- report_type
- generated_by
- generated_date
- file_path
