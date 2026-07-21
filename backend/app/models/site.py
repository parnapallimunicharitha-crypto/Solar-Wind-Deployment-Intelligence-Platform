from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=True)
    land_area = Column(Float, nullable=True)
    region = Column(String, nullable=True)
    infrastructure = Column(String, nullable=True)
    ownership = Column(String, nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    project = relationship("Project", back_populates="sites")
    features = relationship("Feature", back_populates="site", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="site", cascade="all, delete-orphan")

