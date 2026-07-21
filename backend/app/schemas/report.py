from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ReportCreate(BaseModel):
    title: str = Field(..., min_length=1)
    site_id: int
    report_type: Optional[str] = "Assessment"


class ReportResponse(BaseModel):
    id: int
    title: str
    report_type: str
    summary: Optional[str] = None
    deployment_recommendation: Optional[str] = None
    overall_suitability_score: Optional[str] = None
    site_id: Optional[int] = None
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
