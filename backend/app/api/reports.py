from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.auth.auth_handler import get_db, get_current_user
from app.models.user import User
from app.models.site import Site
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse
from app.services.assessment_service import AssessmentService

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

assessment_service = AssessmentService()


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate and save a JSON resource assessment report for a site.
    """
    # 1. Verify Site exists
    site = db.query(Site).filter(Site.id == report_data.site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Site with ID {report_data.site_id} not found"
        )

    # 2. Perform on-the-fly assessment for site's coordinates
    try:
        assessment_result = assessment_service.perform_assessment(site.latitude, site.longitude)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate assessment for site: {str(e)}"
        )

    import json
    # 3. Create Report record
    new_report = Report(
        title=report_data.title,
        report_type=report_data.report_type,
        summary=json.dumps(assessment_result),
        deployment_recommendation=assessment_result["deployment_recommendation"]["deployment"],
        overall_suitability_score=str(assessment_result["suitability_score"]["overall_score"]),
        site_id=site.id,
        user_id=current_user.id
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


@router.get("/", response_model=List[ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all generated reports.
    """
    return db.query(Report).filter(Report.user_id == current_user.id).all()


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a report by ID.
    """
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    return report
