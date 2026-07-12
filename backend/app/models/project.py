from sqlalchemy import Column, Integer, String
from app.database.database import Base

class Project(Base):

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    project_name = Column(String)

    location = Column(String)