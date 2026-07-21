from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class FeatureStore(Base):
    __tablename__ = "feature_store"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    solar_irradiance = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    slope = Column(Float, nullable=True)
    road_distance = Column(Float, nullable=True)
    substation_distance = Column(Float, nullable=True)
    suitability_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    site = relationship("Site")
