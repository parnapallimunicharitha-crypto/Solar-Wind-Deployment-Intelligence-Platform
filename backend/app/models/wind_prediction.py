from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.database.database import Base

class WindPrediction(Base):
    __tablename__ = "wind_predictions"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    predicted_wind_speed = Column(Float, nullable=True)
    capacity_factor = Column(Float, nullable=True)
    wind_class = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
