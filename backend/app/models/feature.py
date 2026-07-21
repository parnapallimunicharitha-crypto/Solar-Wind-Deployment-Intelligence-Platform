from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    solar_irradiance = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    slope = Column(Float, nullable=True)

    # Engineered features
    road_distance = Column(Float, nullable=True)
    substation_distance = Column(Float, nullable=True)
    capacity_factor = Column(Float, nullable=True)
    wind_class = Column(String, nullable=True)
    terrain_score = Column(Float, nullable=True)
    accessibility_score = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)

    site = relationship("Site", back_populates="features")