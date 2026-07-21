from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class SolarPrediction(Base):
    __tablename__ = "solar_predictions"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    predicted_irradiance = Column(Float, nullable=True)
    suitability_score = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
