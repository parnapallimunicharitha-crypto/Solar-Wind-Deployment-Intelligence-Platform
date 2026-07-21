from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Renewable Energy Planner")
    # Optional profile fields (Milestone 1 — User Profile)
    email = Column(String, nullable=True, default=None)
    full_name = Column(String, nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="created_by", cascade="all, delete-orphan")
