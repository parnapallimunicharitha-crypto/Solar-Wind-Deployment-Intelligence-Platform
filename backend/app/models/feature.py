from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class Feature(Base):

    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)

    latitude = Column(Float)

    longitude = Column(Float)

    solar_irradiance = Column(Float)

    wind_speed = Column(Float)

    temperature = Column(Float)

    humidity = Column(Float)

    elevation = Column(Float)

    slope = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())