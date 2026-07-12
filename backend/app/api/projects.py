from fastapi import APIRouter

router = APIRouter()

@router.get("/projects")
def get_projects():

    return [
        {
            "id":1,
            "project_name":"Demo Solar Project",
            "location":"Odisha"
        }
    ]