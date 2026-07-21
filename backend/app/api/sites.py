from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.auth.auth_handler import get_db, get_current_user, RoleChecker
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.feature import Feature
from app.schemas.site import SiteCreate, SiteUpdate, SiteResponse
from app.feature_engineering.feature_builder import FeatureBuilder

router = APIRouter(
    prefix="/sites",
    tags=["Sites"]
)


@router.post("/", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    site_data: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Project Manager", "Administrator", "Renewable Energy Planner"]))
):
    """
    Create a new site within a project. Automatically extracts and records spatial features.
    """
    # Verify the project exists
    project = db.query(Project).filter(Project.id == site_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {site_data.project_id} not found"
        )

    # Create the site
    new_site = Site(
        latitude=site_data.latitude,
        longitude=site_data.longitude,
        elevation=site_data.elevation,
        land_area=site_data.land_area,
        region=site_data.region,
        infrastructure=site_data.infrastructure,
        ownership=site_data.ownership,
        project_id=site_data.project_id
    )
    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    # Automatically trigger FeatureBuilder and save features to DB
    try:
        builder = FeatureBuilder()
        feats = builder.build_features(new_site.latitude, new_site.longitude)

        # Update site elevation if not provided
        if new_site.elevation is None and feats.get("elevation") is not None:
            new_site.elevation = feats.get("elevation")
            db.commit()
            db.refresh(new_site)

        feature_record = Feature(
            latitude=new_site.latitude,
            longitude=new_site.longitude,
            solar_irradiance=feats.get("solar_irradiance"),
            wind_speed=feats.get("wind_speed"),
            temperature=feats.get("temperature"),
            humidity=feats.get("humidity"),
            elevation=feats.get("elevation"),
            slope=feats.get("slope"),
            road_distance=feats.get("road_distance"),
            substation_distance=feats.get("substation_distance"),
            capacity_factor=feats.get("capacity_factor"),
            wind_class=feats.get("wind_class"),
            terrain_score=feats.get("terrain_score"),
            accessibility_score=feats.get("accessibility_score"),
            site_id=new_site.id
        )
        db.add(feature_record)
        db.commit()
    except Exception as e:
        # Log error but don't fail the site creation transaction
        print(f"Error engineering features for site: {e}")

    return new_site


@router.get("/", response_model=List[SiteResponse])
def get_sites(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all sites, optionally filtered by project_id.
    """
    query = db.query(Site)
    if project_id is not None:
        query = query.filter(Site.project_id == project_id)
    return query.all()


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve detailed site information by site_id.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site with ID {site_id} not found"
        )
    return site


@router.put("/{site_id}", response_model=SiteResponse)
def update_site(
    site_id: int,
    site_data: SiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Project Manager", "Administrator", "Renewable Energy Planner"]))
):
    """
    Update site details.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site with ID {site_id} not found"
        )

    for field, value in site_data.model_dump(exclude_unset=True).items():
        if field == "project_id" and value is not None:
            # Verify new project exists
            project = db.query(Project).filter(Project.id == value).first()
            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Project with ID {value} not found"
                )
        setattr(site, field, value)

    db.commit()
    db.refresh(site)
    return site


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Project Manager", "Administrator"]))
):
    """
    Delete a site.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site with ID {site_id} not found"
        )
    db.delete(site)
    db.commit()
    return None