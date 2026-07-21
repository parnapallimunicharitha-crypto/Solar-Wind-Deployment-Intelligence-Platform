from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    role: Optional[str] = "Renewable Energy Planner"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class ProfileUpdate(BaseModel):
    """Schema for updating non-sensitive profile fields (email, full_name)."""
    email: Optional[str] = Field(None, max_length=255)
    full_name: Optional[str] = Field(None, max_length=100)


class PasswordChange(BaseModel):
    """Schema for changing the user's own password."""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, description="New password — minimum 6 characters")
