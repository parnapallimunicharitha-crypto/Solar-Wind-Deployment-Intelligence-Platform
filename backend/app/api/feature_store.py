from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.auth.auth_handler import get_db, get_current_user
from app.models.feature_store import FeatureStore
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(
    prefix="/feature-store",
    tags=["Feature Store"]
)

class FeatureStoreBase(BaseModel):
    latitude: float
    longitude: float
    solar_irradiance: Optional[float] = None
    wind_speed: Optional[float] = None
    elevation: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    slope: Optional[float] = None
    road_distance: Optional[float] = None
    substation_distance: Optional[float] = None
    suitability_score: Optional[float] = None
    site_id: Optional[int] = None

class FeatureStoreCreate(FeatureStoreBase):
    pass

class FeatureStoreResponse(FeatureStoreBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=FeatureStoreResponse, status_code=status.HTTP_201_CREATED)
def create_feature_store_record(
    data: FeatureStoreCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Create a new Feature Store record.
    """
    record = FeatureStore(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=List[FeatureStoreResponse])
def get_all_feature_store_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Retrieve all feature store records.
    """
    return db.query(FeatureStore).all()


@router.get("/{id}", response_model=FeatureStoreResponse)
def get_feature_store_record_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get a feature store record by ID.
    """
    record = db.query(FeatureStore).filter(FeatureStore.id == id).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Feature store record with ID {id} not found"
        )
    return record
