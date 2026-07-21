from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=True)
    category = Column(String, nullable=True)
    deployment_recommendation = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    reason = Column(Text, nullable=True)
    result_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    site = relationship("Site")
    user = relationship("User")
