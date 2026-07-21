from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth.auth_handler import get_db, get_current_user
from app.models.project import Project
from app.models.site import Site
from app.models.feature import Feature

router = APIRouter(tags=["Home"])


@router.get("/")
def home():
    return {
        "message": "Welcome to Solar & Wind Deployment Intelligence Platform",
        "version": "1.0.0"
    }


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return high-level dashboard statistics including project/site counts and
    aggregated solar/wind/accessibility scores derived from stored feature records.
    """
    total_projects = db.query(Project).count()
    total_sites = db.query(Site).count()

    # Aggregate average scores from the feature store
    features = db.query(Feature).all()

    avg_solar = 0.0
    avg_wind = 0.0
    avg_terrain = 0.0
    avg_accessibility = 0.0
    avg_capacity_factor = 0.0

    if features:
        n = len(features)
        avg_solar = round(
            sum(f.solar_irradiance for f in features if f.solar_irradiance is not None) / n, 2
        )
        avg_wind = round(
            sum(f.wind_speed for f in features if f.wind_speed is not None) / n, 2
        )
        avg_terrain = round(
            sum(f.terrain_score for f in features if f.terrain_score is not None) / n, 2
        )
        avg_accessibility = round(
            sum(f.accessibility_score for f in features if f.accessibility_score is not None) / n, 2
        )
        avg_capacity_factor = round(
            sum(f.capacity_factor for f in features if f.capacity_factor is not None) / n, 2
        )

    return {
        "total_projects": total_projects,
        "total_sites": total_sites,
        "total_features": len(features),
        "avg_solar_irradiance": avg_solar,
        "avg_wind_speed": avg_wind,
        "avg_terrain_score": avg_terrain,
        "avg_accessibility_score": avg_accessibility,
        "avg_capacity_factor": avg_capacity_factor,
        "platform": "Solar & Wind Deployment Intelligence"
    }