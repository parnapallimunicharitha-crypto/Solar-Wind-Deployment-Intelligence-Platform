from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class ProjectBase(BaseModel):
    project_name: str = Field(..., min_length=1)
    region: str = Field(..., min_length=1)
    description: Optional[str] = None
    status: Optional[str] = "Draft"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    region: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    created_date: datetime
    user_id: int

    class Config:
        from_attributes = True
