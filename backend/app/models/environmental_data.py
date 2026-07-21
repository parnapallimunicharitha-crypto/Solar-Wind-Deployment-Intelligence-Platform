from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class EnvironmentalData(Base):
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True)
    solar_irradiance = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    slope = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
