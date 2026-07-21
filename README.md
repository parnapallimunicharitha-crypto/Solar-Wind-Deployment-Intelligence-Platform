# Solar & Wind Deployment Intelligence Platform

An AI-powered decision support system for renewable energy spatial planning, site assessment, and deployment optimization. This platform integrates multi-source geospatial data (NASA POWER solar weather data, Global Wind Atlas, SRTM Digital Elevation Models, and OpenStreetMap infrastructure data) to determine the absolute suitability and ideal deployment strategy (Solar, Wind, or Hybrid) for any geographic coordinates.

---

## Folder & Project Structure

The project is divided into a FastAPI Python backend and a React (Vite) frontend.

```
Solar_Wind_Deployment_Intelligence_Platform/
├── backend/
│   ├── app/
│   │   ├── api/                    # API Routers (Auth, Projects, Sites, Features, Assessment)
│   │   ├── auth/                   # JWT & OAuth2 Password Bearer implementation, password hashing
│   │   ├── data_sources/           # Third-party clients (NASA POWER, Global Wind Atlas, SRTM, OSM)
│   │   ├── database/               # SQLAlchemy Session and database engine setup
│   │   ├── feature_engineering/    # FeatureBuilder engine for flattening GIS & weather variables
│   │   ├── models/                 # SQLAlchemy DB Models (User, Project, Site, Feature, Report)
│   │   ├── schemas/                # Pydantic validation schemas
│   │   ├── services/               # Core physics & evaluation engines (Solar, Wind, Terrain, Infrastructure)
│   │   ├── spatial/                # Raster & vector spatial processors
│   │   ├── utils/                  # Coordinate and helper utilities
│   │   └── main.py                 # FastAPI application initializer
│   ├── requirements.txt            # Python backend dependencies
│   └── tests/                      # Pytest automated test suite
├── frontend/
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── assets/                 # SVGs and images
│   │   ├── components/             # Reusable UI elements (SiteMap, MetricCard, Modals, Charts, etc.)
│   │   ├── context/                # AuthContext for session propagation
│   │   ├── pages/                  # Route page components (Dashboard, Projects, Sites, Assessment, etc.)
│   │   ├── services/               # Axios API instance
│   │   ├── App.jsx                 # Routing configuration
│   │   ├── index.css               # Core Tailwind styles and custom UI animations
│   │   └── main.jsx                # Application root mount
│   ├── tailwind.config.js          # Tailwind styling tokens
│   ├── vite.config.js              # Vite compiler configuration
│   └── package.json                # Frontend package dependencies
└── README.md                       # Platform documentation
```

---

## Core API List

Below are the key backend endpoints exposed by the FastAPI server:

### 1. Authentication (`/auth`)
* `POST /auth/register` — Register a new user with a specified role (`Renewable Energy Planner`, `GIS Analyst`, `Project Manager`, `Administrator`).
* `POST /auth/login` — Authenticate username/password and receive a JWT access token.
* `GET /auth/profile` — Fetch the logged-in user's profile information.
* `GET /auth/users` — Directory of registered platform users (used for team listings).

### 2. Project Management (`/projects`)
* `GET /projects/` — Retrieve all projects.
* `POST /projects/` — Create a new project (Requires `Project Manager` or `Administrator`).
* `GET /projects/{project_id}` — Get details of a single project.
* `PUT /projects/{project_id}` — Update project metadata (Requires `Project Manager` or `Administrator`).
* `DELETE /projects/{project_id}` — Delete a project and its sites (Requires `Project Manager` or `Administrator`).

### 3. Site Management (`/sites`)
* `GET /sites/` — Retrieve registered sites (optionally filtered by `project_id`).
* `POST /sites/` — Register a new site. Automatically triggers spatial feature extraction for the coordinates.
* `GET /sites/{site_id}` — Get detailed site information.
* `PUT /sites/{site_id}` — Update site parameters.
* `DELETE /sites/{site_id}` — Delete a site.

### 4. Spatial Features Store (`/features`)
* `GET /features/` — Fetch all spatial feature records in the DB.
* `GET /features/location` — Query raw and engineered features for exact coordinates.
* `GET /features/{feature_id}` — Get feature record by ID.

### 5. Resource Assessment Engine (`/assessment`)
* `GET /assessment` — Runs on-the-fly weather, wind, terrain, and infrastructure analysis at the given coordinates. Returns solar/wind assessments, a composite suitability score (35% resource, 25% terrain, 15% infrastructure, 15% env, 10% economic), and deployment recommendations.

---

## How to Run the Backend

### Prerequisites
1. **Python 3.10+** installed.
2. **PostgreSQL** running locally with a database configured.

### Setup Steps
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Database Connection:
   Update the database connection string in [database.py](file:///c:/Users/dell/OneDrive/Desktop/Solar_Wind_Deployment_Intelligence_Platform/backend/app/database/database.py):
   ```python
   DATABASE_URL = "postgresql://<username>:<password>@localhost:5432/<database_name>"
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
6. The interactive API documentation will be available at:
   * Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   * Redoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Running Backend Tests
To verify backend correctness using pytest:
```bash
pytest
```

---

## How to Run the Frontend

### Prerequisites
1. **Node.js (v18+)** and **npm** installed.

### Setup Steps
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at:
   * Local Server: [http://localhost:5173](http://localhost:5173)
