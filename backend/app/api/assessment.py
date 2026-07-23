from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth.auth_handler import get_current_user, get_db
from app.schemas.assessment import (
    AssessmentResponse,
    EnergyEstimationResponse,
    EnergyEstimationRequest
)
from app.services.assessment_service import AssessmentService
from app.services.energy_estimation_service import EnergyEstimationService
from app.models.assessment import Assessment
from app.models.site import Site
from app.models.project import Project
from app.models.feature import Feature
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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


class SiteRankRequest(BaseModel):
    sites: List[Dict[str, Any]]
    weights: Optional[Dict[str, float]] = None


@router.get("", response_model=AssessmentResponse)
def get_resource_assessment(
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Perform a complete resource assessment for solar and wind deployment at a specific coordinate,
    and rank candidate registered sites.
    """
    try:
        res = assessment_service.perform_assessment(latitude, longitude)

        # Retrieve registered candidate sites for candidate site ranking
        db_sites = db.query(Site).all()
        candidate_list = []

        if db_sites:
            for s in db_sites:
                feat = db.query(Feature).filter(Feature.site_id == s.id).first()
                if feat:
                    # Run suitability for candidate site features
                    suit = assessment_service.suitability_service.assess_suitability_from_features(
                        solar_irradiance=feat.solar_irradiance or 5.0,
                        wind_speed=feat.wind_speed or 5.0,
                        temperature=feat.temperature or 25.0,
                        slope=feat.slope or 0.0,
                        road_distance=feat.road_distance or 5.0,
                        substation_distance=feat.substation_distance or 10.0,
                        elevation=feat.elevation or s.elevation or 0.0,
                        latitude=s.latitude
                    )
                    candidate_list.append({
                        "id": s.id,
                        "site_name": getattr(s, "site_name", f"Site #{s.id}"),
                        "latitude": s.latitude,
                        "longitude": s.longitude,
                        "region": s.region or "N/A",
                        "renewable_resource_score": suit["renewable_resource_score"],
                        "terrain_score": suit["terrain_score"],
                        "infrastructure_score": suit["infrastructure_score"],
                        "environmental_score": suit["environmental_score"],
                        "economic_score": suit["economic_score"],
                        "overall_score": suit["overall_score"],
                        "category": suit["category"]
                    })
                else:
                    candidate_list.append({
                        "id": s.id,
                        "site_name": getattr(s, "site_name", f"Site #{s.id}"),
                        "latitude": s.latitude,
                        "longitude": s.longitude,
                        "region": s.region or "N/A",
                        "renewable_resource_score": 65.0,
                        "terrain_score": 70.0,
                        "infrastructure_score": 60.0,
                        "environmental_score": 75.0,
                        "economic_score": 65.0,
                        "overall_score": 67.0,
                        "category": "Moderately Suitable"
                    })

        # Include assessed target coordinate as an active candidate site in ranking
        candidate_list.append({
            "id": "current",
            "site_name": "Assessed Location",
            "latitude": latitude,
            "longitude": longitude,
            "region": "Current Query",
            "renewable_resource_score": res["suitability_score"]["renewable_resource_score"],
            "terrain_score": res["suitability_score"]["terrain_score"],
            "infrastructure_score": res["suitability_score"]["infrastructure_score"],
            "environmental_score": res["suitability_score"]["environmental_score"],
            "economic_score": res["suitability_score"]["economic_score"],
            "overall_score": res["suitability_score"]["overall_score"],
            "category": res["suitability_score"]["category"]
        })

        # Rank all candidate sites using ranking engine
        ranked_candidates = assessment_service.rank_candidate_sites(candidate_list)
        res["candidate_ranking"] = ranked_candidates

        return res
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate resource assessment: {str(e)}"
        )


@router.post("/rank", response_model=List[Dict[str, Any]])
def rank_sites_endpoint(
    req: SiteRankRequest,
    current_user=Depends(get_current_user)
):
    """
    Rank candidate sites in descending order of overall suitability score.
    """
    try:
        return assessment_service.rank_candidate_sites(req.sites, req.weights)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to rank candidate sites: {str(e)}"
        )


@router.post("/energy-estimate", response_model=EnergyEstimationResponse)
def estimate_energy_endpoint(
    req: EnergyEstimationRequest,
    current_user=Depends(get_current_user)
):
    """
    Calculate annual energy yield (solar, wind, hybrid) for candidate deployment parameters.
    """
    try:
        service = EnergyEstimationService()
        return service.estimate_energy(
            site_evaluation_result=req.site_evaluation_result,
            deployment_type=req.deployment_type,
            installed_capacity=req.installed_capacity,
            operating_hours=req.operating_hours or 8760.0,
            solar_capacity_factor=req.solar_capacity_factor,
            wind_capacity_factor=req.wind_capacity_factor
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Energy estimation failed: {str(e)}"
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
