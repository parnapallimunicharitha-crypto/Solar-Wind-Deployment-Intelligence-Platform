from fastapi import FastAPI

from app.api.home import router as home_router
from app.api.projects import router as project_router
from app.api.sites import router as site_router
from app.api.predictions import router as prediction_router

from app.database.database import engine, Base
from app.models.project import Project

app = FastAPI(
    title="Solar & Wind Deployment Intelligence Platform"
)

Base.metadata.create_all(bind=engine)

app.include_router(home_router)
app.include_router(project_router)
app.include_router(site_router)
app.include_router(prediction_router)