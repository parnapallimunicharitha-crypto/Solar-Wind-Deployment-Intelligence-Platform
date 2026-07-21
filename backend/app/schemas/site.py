from pydantic import BaseModel, Field
from typing import Optional


class SiteBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    elevation: Optional[float] = None
    land_area: Optional[float] = None
    region: Optional[str] = None
    infrastructure: Optional[str] = None
    ownership: Optional[str] = None


class SiteCreate(SiteBase):
    project_id: int


class SiteUpdate(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    elevation: Optional[float] = None
    land_area: Optional[float] = None
    region: Optional[str] = None
    infrastructure: Optional[str] = None
    ownership: Optional[str] = None
    project_id: Optional[int] = None


class SiteResponse(SiteBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True
