from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth.auth_handler import get_db, get_current_user
from app.models.project import Project
from app.models.site import Site
from app.models.feature import Feature
from app.models.report import Report

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get core metrics counters and system averages for Dashboard stats.
    """
    total_projects = db.query(Project).count()
    total_sites = db.query(Site).count()
    total_features = db.query(Feature).count()
    total_reports = db.query(Report).count()

    features = db.query(Feature).all()
    avg_solar = 0.0
    avg_wind = 0.0
    avg_terrain = 0.0
    avg_accessibility = 0.0
    avg_capacity_factor = 0.0

    if features:
        n = len(features)
        avg_solar = sum(f.solar_irradiance for f in features if f.solar_irradiance is not None) / n
        avg_wind = sum(f.wind_speed for f in features if f.wind_speed is not None) / n
        avg_terrain = sum(f.terrain_score for f in features if f.terrain_score is not None) / n
        avg_accessibility = sum(f.accessibility_score for f in features if f.accessibility_score is not None) / n
        avg_capacity_factor = sum(f.capacity_factor for f in features if f.capacity_factor is not None) / n

    return {
        "total_projects": total_projects,
        "total_sites": total_sites,
        "total_features": total_features,
        "total_reports": total_reports,
        "avg_solar_irradiance": round(avg_solar, 2),
        "avg_wind_speed": round(avg_wind, 2),
        "avg_terrain_score": round(avg_terrain, 2),
        "avg_accessibility_score": round(avg_accessibility, 2),
        "avg_capacity_factor": round(avg_capacity_factor, 2)
    }


@router.get("/charts")
def get_dashboard_charts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get aggregated data structures for Chart.js dashboard charts.
    """
    # 1. Project Status Pie Chart Data
    statuses = ["Draft", "Active", "Completed", "On Hold"]
    status_counts = {}
    for status in statuses:
        status_counts[status] = db.query(Project).filter(Project.status == status).count()

    # 2. Environmental aggregates for Radar
    features = db.query(Feature).all()
    avg_solar = 0.0
    avg_wind = 0.0
    avg_terrain = 0.0
    avg_accessibility = 0.0
    avg_capacity_factor = 0.0

    if features:
        n = len(features)
        avg_solar = sum(f.solar_irradiance for f in features if f.solar_irradiance is not None) / n
        avg_wind = sum(f.wind_speed for f in features if f.wind_speed is not None) / n
        avg_terrain = sum(f.terrain_score for f in features if f.terrain_score is not None) / n
        avg_accessibility = sum(f.accessibility_score for f in features if f.accessibility_score is not None) / n
        avg_capacity_factor = sum(f.capacity_factor for f in features if f.capacity_factor is not None) / n

    return {
        "project_status": status_counts,
        "radar_averages": {
            "solar_irradiance_score": round(((avg_solar / 8) * 100) if avg_solar else 0.0, 1),
            "wind_speed_score": round(((avg_wind / 12) * 100) if avg_wind else 0.0, 1),
            "terrain_score": round(avg_terrain, 1),
            "accessibility_score": round(avg_accessibility, 1),
            "capacity_factor_score": round(((avg_capacity_factor / 50) * 100) if avg_capacity_factor else 0.0, 1)
        }
    }


@router.get("/recent-projects")
def get_recent_projects(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get list of 5 most recently created projects.
    """
    projects = db.query(Project).order_by(Project.created_date.desc()).limit(5).all()
    return projects


@router.get("/recent-sites")
def get_recent_sites(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get list of 5 most recently created sites.
    """
    sites = db.query(Site).order_by(Site.id.desc()).limit(5).all()
    return sites
