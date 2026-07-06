# Database Design

## Project Name

Solar & Wind Deployment Intelligence Platform

## Objective

The database is designed to store user information, project details, environmental datasets, prediction results, site suitability scores, and generated reports. It supports solar and wind energy analysis and helps identify suitable locations for renewable energy deployment.

---

# 1. Users Table

## Purpose

Stores user account information for authentication.

| Column Name | Data Type    | Description           | Key         |
| ----------- | ------------ | --------------------- | ----------- |
| user_id     | INT          | Unique user ID        | Primary Key |
| full_name   | VARCHAR(100) | User's name           |             |
| email       | VARCHAR(100) | User email            | Unique      |
| password    | VARCHAR(255) | Encrypted password    |             |
| created_at  | TIMESTAMP    | Account creation date |             |

---

# 2. Projects Table

## Purpose

Stores project details created by users.

| Column Name  | Data Type    | Description           | Key         |
| ------------ | ------------ | --------------------- | ----------- |
| project_id   | INT          | Project ID            | Primary Key |
| user_id      | INT          | Owner of project      | Foreign Key |
| project_name | VARCHAR(150) | Project title         |             |
| description  | TEXT         | Project description   |             |
| created_at   | TIMESTAMP    | Project creation date |             |

Relationship:
Users (1) → (Many) Projects

---

# 3. Sites Table

## Purpose

Stores candidate locations for renewable energy deployment.

| Column Name | Data Type     | Description     | Key         |
| ----------- | ------------- | --------------- | ----------- |
| site_id     | INT           | Site ID         | Primary Key |
| project_id  | INT           | Related project | Foreign Key |
| latitude    | DECIMAL(10,6) | Latitude        |             |
| longitude   | DECIMAL(10,6) | Longitude       |             |
| city        | VARCHAR(100)  | City            |             |
| state       | VARCHAR(100)  | State           |             |

Relationship:
Projects (1) → (Many) Sites

---

# 4. EnvironmentalData Table

## Purpose

Stores environmental information collected from different datasets.

| Column Name     | Data Type    | Description                  | Key         |
| --------------- | ------------ | ---------------------------- | ----------- |
| env_id          | INT          | Environmental Data ID        | Primary Key |
| site_id         | INT          | Related Site                 | Foreign Key |
| solar_radiation | FLOAT        | NASA POWER Solar Radiation   |             |
| wind_speed      | FLOAT        | Global Wind Atlas Wind Speed |             |
| power_density   | FLOAT        | Wind Power Density           |             |
| elevation       | FLOAT        | SRTM Elevation               |             |
| land_cover      | VARCHAR(100) | Sentinel-2 Land Cover        |             |

Relationship:
Sites (1) → (1) EnvironmentalData

---

# 5. SolarPrediction Table

## Purpose

Stores predicted solar energy values.

| Column Name         | Data Type | Description         | Key         |
| ------------------- | --------- | ------------------- | ----------- |
| solar_prediction_id | INT       | Prediction ID       | Primary Key |
| env_id              | INT       | Environmental Data  | Foreign Key |
| predicted_output    | FLOAT     | Solar energy output |             |
| prediction_date     | DATE      | Prediction date     |             |

Relationship:
EnvironmentalData (1) → (Many) SolarPrediction

---

# 6. WindPrediction Table

## Purpose

Stores predicted wind energy values.

| Column Name        | Data Type | Description        | Key         |
| ------------------ | --------- | ------------------ | ----------- |
| wind_prediction_id | INT       | Prediction ID      | Primary Key |
| env_id             | INT       | Environmental Data | Foreign Key |
| predicted_output   | FLOAT     | Wind energy output |             |
| prediction_date    | DATE      | Prediction date    |             |

Relationship:
EnvironmentalData (1) → (Many) WindPrediction

---

# 7. SuitabilityScore Table

## Purpose

Stores the final suitability score of each location.

| Column Name    | Data Type   | Description             | Key         |
| -------------- | ----------- | ----------------------- | ----------- |
| score_id       | INT         | Score ID                | Primary Key |
| site_id        | INT         | Related Site            | Foreign Key |
| solar_score    | FLOAT       | Solar suitability score |             |
| wind_score     | FLOAT       | Wind suitability score  |             |
| overall_score  | FLOAT       | Final site score        |             |
| recommendation | VARCHAR(50) | Suitable / Not Suitable |             |

Relationship:
Sites (1) → (1) SuitabilityScore

---

# 8. Reports Table

## Purpose

Stores generated reports.

| Column Name    | Data Type    | Description            | Key         |
| -------------- | ------------ | ---------------------- | ----------- |
| report_id      | INT          | Report ID              | Primary Key |
| project_id     | INT          | Related Project        | Foreign Key |
| report_name    | VARCHAR(150) | Report title           |             |
| report_type    | VARCHAR(50)  | PDF / Excel            |             |
| generated_date | TIMESTAMP    | Report generation time |             |

Relationship:
Projects (1) → (Many) Reports

---

# Database Relationships

Users
│
└── Projects
│
└── Sites
│
├── EnvironmentalData
│ ├── SolarPrediction
│ └── WindPrediction
│
└── SuitabilityScore
│
└── Reports

---

# Datasets Used

| Dataset                  | Used In           |
| ------------------------ | ----------------- |
| NASA POWER               | EnvironmentalData |
| Global Wind Atlas        | EnvironmentalData |
| Sentinel-2 (EuroSAT RGB) | EnvironmentalData |
| OpenStreetMap            | Sites             |
| SRTM DEM                 | EnvironmentalData |

---

# Summary

The database consists of eight tables that manage users, projects, locations, environmental datasets, solar and wind predictions, site suitability scores, and generated reports. Primary Keys uniquely identify each record, while Foreign Keys establish relationships between tables. This design supports efficient storage, retrieval, and analysis of renewable energy data for the Solar & Wind Deployment Intelligence Platform.

# Module Responsibility Mapping

## Project Name

Solar & Wind Deployment Intelligence Platform

## Objective

This document defines the responsibilities of each module in the Solar & Wind Deployment Intelligence Platform. Each module performs a specific task to ensure smooth data processing, prediction, analysis, and report generation.

---

# 1. Authentication Module

## Responsibility

- User Registration
- User Login
- Password Security
- User Authentication
- Session Management

Input:

- User Email
- Password

Output:

- Secure User Access

---

# 2. Solar Prediction Module

## Responsibility

- Read NASA POWER dataset
- Process solar weather parameters
- Predict solar energy output
- Store prediction results

Dataset Used:

- NASA POWER

Input:

- Solar Radiation
- Temperature
- Weather Data

Output:

- Predicted Solar Energy

---

# 3. Wind Prediction Module

## Responsibility

- Read Global Wind Atlas dataset
- Process wind speed and power density
- Predict wind energy generation

Dataset Used:

- Global Wind Atlas

Input:

- Wind Speed
- Power Density
- Wind Direction

Output:

- Predicted Wind Energy

---

# 4. Site Suitability Module

## Responsibility

- Analyze land cover
- Analyze terrain elevation
- Analyze nearby locations
- Calculate suitability score

Datasets Used:

- Sentinel-2 (EuroSAT RGB)
- SRTM DEM
- OpenStreetMap

Input:

- Land Cover
- Elevation
- Infrastructure
- Solar Prediction
- Wind Prediction

Output:

- Site Suitability Score
- Recommended Locations

---

# 5. Database Module

## Responsibility

- Store project information
- Store environmental data
- Store prediction results
- Store reports
- Retrieve project records

Database:

- PostgreSQL

Input:

- User Data
- Prediction Data

Output:

- Organized Project Database

---

# 6. Reports Module

## Responsibility

- Generate PDF Reports
- Generate Excel Reports
- Export prediction results

Input:

- Prediction Results
- Site Suitability Score

Output:

- PDF Report
- Excel Report

---

# 7. Dashboard Module

## Responsibility

- Display predictions
- Show graphs
- Display maps
- Show site suitability results

Input:

- Database Records

Output:

- Interactive Dashboard

---

# 8. API Services Module

## Responsibility

- Connect Frontend and Backend
- Receive user requests
- Send prediction results
- Manage API communication

Framework:

- FastAPI

Input:

- API Request

Output:

- JSON Response

---

# Module Workflow

User
│
▼
Authentication
│
▼
Frontend
│
▼
API Services (FastAPI)
│
▼
Backend
│
├── Solar Prediction
├── Wind Prediction
├── Site Suitability
│
▼
Database (PostgreSQL)
│
▼
Reports & Dashboard

---

# Module Summary

| Module           | Responsibility               | Input                 | Output            |
| ---------------- | ---------------------------- | --------------------- | ----------------- |
| Authentication   | Secure user login            | Email, Password       | User Access       |
| Solar Prediction | Predict solar energy         | NASA POWER            | Solar Output      |
| Wind Prediction  | Predict wind energy          | Global Wind Atlas     | Wind Output       |
| Site Suitability | Analyze location suitability | Sentinel-2, SRTM, OSM | Site Score        |
| Database         | Store project data           | Predictions           | Organized Records |
| Reports          | Generate reports             | Prediction Results    | PDF/Excel         |
| Dashboard        | Display results              | Database              | Graphs & Maps     |
| API Services     | Connect frontend & backend   | API Requests          | JSON Responses    |

---

# Conclusion

The Solar & Wind Deployment Intelligence Platform is divided into eight modules. Each module has a specific responsibility, from user authentication to renewable energy prediction, site suitability analysis, database management, report generation, and dashboard visualization. Together, these modules provide an efficient and organized workflow for analyzing renewable energy deployment sites.
