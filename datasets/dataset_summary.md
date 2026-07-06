# Dataset Summary

## Project Name

Solar & Wind Deployment Intelligence Platform

---

## 1. NASA POWER Dataset

Source:
NASA POWER (Downloaded from Kaggle)

Dataset Name:
NASA POWER 10 Years Hourly Dataset (2015–2025)

Purpose:
Provides hourly weather and solar radiation data used for solar energy prediction.

Files:

- nasa_power_2015to2025_hourly_data_ENGLAND.csv
- nasa_power_2015to2025_hourly_data_SCOTLAND.csv
- nasa_power_2015to2025_hourly_data_WALES.csv
- nasa_power_2015to2025_hourly_data_NORTHERN_IRELAND.csv

Rows & Columns:
Contains hourly weather observations from 2015–2025 with multiple environmental parameters.

Important Columns:

- YEAR
- MO
- DY
- HR
- ALLSKY_SFC_SW_DWN
- T2M
- WS10M
- RH2M

Data Types:
Integer, Float

Missing Values:
No significant missing values observed.

Unnecessary Columns:
None identified.

Role in Project:
Used for Solar Prediction Module.

---

## 2. Global Wind Atlas Dataset

Source:
Global Wind Atlas

Purpose:
Provides wind resource information for wind energy prediction.

Files:

- powerDensity.csv
- windSpeed.csv
- windFrequencyRose.csv
- windPowerRose.csv
- windSpeedRose.csv

Rows & Columns:
CSV files containing wind speed, wind direction, power density, and wind frequency information.

Important Columns:

- Wind Speed
- Power Density
- Wind Direction
- Frequency

Data Types:
Numeric (Float)

Missing Values:
No significant missing values observed.

Unnecessary Columns:
None identified.

Role in Project:
Used for Wind Prediction Module.

---

## 3. Sentinel-2 Dataset

Source:
EuroSAT RGB Dataset (Kaggle)

Purpose:
Used for land cover classification and site suitability analysis.

Dataset Contents:
RGB satellite images classified into:

- AnnualCrop
- Forest
- Highway
- Industrial
- Pasture
- PermanentCrop
- Residential
- River
- SeaLake
- HerbaceousVegetation

Data Type:
Image Dataset (.jpg)

Rows & Columns:
Not applicable (Image dataset)

Missing Values:
Not applicable.

Unnecessary Files:
None.

Role in Project:
Used for identifying land cover suitable for renewable energy deployment.

---

## 4. OpenStreetMap (OSM)

Source:
Geofabrik

Dataset Name:
osm-india-cities-towns.geojson

Purpose:
Provides location and infrastructure information.

File Type:
GeoJSON

Contains:

- Cities
- Towns
- Geographic coordinates

Rows & Columns:
Contains geographic features with attribute information.

Missing Values:
No significant missing values observed.

Role in Project:
Used for mapping nearby infrastructure and location analysis.

---

## 5. SRTM Dataset

Source:
USGS EarthExplorer

Dataset Name:
GeoTIFF 1 Arc-Second

Purpose:
Provides elevation and terrain information.

File Type:
GeoTIFF (.tif)

Contains:
Digital Elevation Model (DEM)

Rows & Columns:
Raster image (Not tabular data)

Missing Values:
Not applicable.

Role in Project:
Used for terrain and elevation analysis in Site Suitability Module.

---

# Overall Summary

The project uses five major datasets:

• NASA POWER – Solar weather data
• Global Wind Atlas – Wind resource data
• Sentinel-2 (EuroSAT RGB) – Land cover imagery
• OpenStreetMap – Infrastructure and location data
• SRTM – Elevation and terrain data

These datasets work together to predict solar energy, wind energy, and determine the most suitable locations for renewable energy deployment.
