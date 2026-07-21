from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.auth.auth_handler import get_db, get_current_user
from app.services.feature_store_service import FeatureStoreService
from app.schemas.feature import FeatureResponse, FeatureCreate
from app.models.feature import Feature

router = APIRouter(
    prefix="/features",
    tags=["Features"]
)

service = FeatureStoreService()


@router.post("/", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_feature(
    feature_data: FeatureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Create or save a new environmental feature record.
    """
    existing = service.get_feature_by_location(db, feature_data.latitude, feature_data.longitude)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feature record already exists at this location"
        )
    feature_rec = Feature(**feature_data.model_dump())
    return service.save_feature(db, feature_rec)


@router.post("/create", response_model=FeatureResponse, status_code=status.HTTP_201_CREATED)
def create_feature_alias(
    feature_data: FeatureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Alias endpoint to create or save a new environmental feature record.
    """
    return create_feature(feature_data, db, current_user)



@router.get("/", response_model=List[FeatureResponse])
def get_all_features(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Retrieve all feature records stored in the system.
    """
    return service.get_all_features(db)


@router.get("/location", response_model=FeatureResponse)
def get_feature_by_location(
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Retrieve a feature record by its exact coordinates.
    """
    feat = service.get_feature_by_location(db, latitude, longitude)
    if not feat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature record at location ({latitude}, {longitude}) not found"
        )
    return feat


@router.get("/{feature_id}", response_model=FeatureResponse)
def get_feature(
    feature_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Retrieve a feature record by its unique ID.
    """
    feat = service.get_feature_by_id(db, feature_id)
    if not feat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature record with ID {feature_id} not found"
        )
    return feat