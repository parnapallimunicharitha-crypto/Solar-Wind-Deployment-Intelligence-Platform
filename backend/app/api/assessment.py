from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth.auth_handler import get_current_user, get_db
from app.schemas.assessment import AssessmentResponse
from app.services.assessment_service import AssessmentService
from app.models.assessment import Assessment
from pydantic import BaseModel
from typing import Optional, List
import json

router = APIRouter(
    prefix="/assessment",
    tags=["Resource Assessment"]
)

assessment_service = AssessmentService()

class AssessmentRequest(BaseModel):
    latitude: float
    longitude: float
    site_id: Optional[int] = None

class AssessmentListResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    overall_score: float
    category: str
    deployment_recommendation: str
    created_at: str

    class Config:
        from_attributes = True

@router.get("", response_model=AssessmentResponse)
def get_resource_assessment(
    latitude: float,
    longitude: float,
    current_user=Depends(get_current_user)
):
    """
    Perform a complete resource assessment for solar and wind deployment at a specific coordinate.
    """
    try:
        return assessment_service.perform_assessment(latitude, longitude)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate resource assessment: {str(e)}"
        )


@router.post("/analyze", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def analyze_location(
    req: AssessmentRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Run full assessment on the coordinate, save it to the history log, and return results.
    """
    try:
        result = assessment_service.perform_assessment(req.latitude, req.longitude)
        
        # Save to database
        db_assessment = Assessment(
            latitude=req.latitude,
            longitude=req.longitude,
            overall_score=result["suitability_score"]["overall_score"],
            category=result["suitability_score"]["category"],
            deployment_recommendation=result["deployment_recommendation"]["deployment"],
            confidence=result["deployment_recommendation"]["confidence"],
            reason=result["deployment_recommendation"]["reason"],
            result_json=json.dumps(result),
            site_id=req.site_id,
            user_id=current_user.id
        )
        db.add(db_assessment)
        db.commit()
        db.refresh(db_assessment)
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run and save assessment: {str(e)}"
        )


@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment_by_id(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Retrieve a historical assessment record by ID.
    """
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Assessment with ID {assessment_id} not found"
        )
    
    try:
        return json.loads(record.result_json)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to deserialize stored assessment record data"
        )


@router.get("/report/{assessment_id}")
def get_assessment_report(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return a structured JSON resource assessment report for the specified assessment.
    """
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Assessment with ID {assessment_id} not found"
        )
    
    try:
        details = json.loads(record.result_json)
    except Exception:
        details = {}

    return {
        "report_id": record.id,
        "title": "Solar & Wind Suitability Assessment Report",
        "latitude": record.latitude,
        "longitude": record.longitude,
        "overall_suitability_score": record.overall_score,
        "suitability_category": record.category,
        "deployment_recommendation": record.deployment_recommendation,
        "reasoning": record.reason,
        "created_at": record.created_at,
        "raw_details": details
    }
