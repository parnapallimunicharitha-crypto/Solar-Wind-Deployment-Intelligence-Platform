from fastapi import APIRouter

router = APIRouter()

@router.get("/sites")
def get_sites():

    return [
        {
            "id":1,
            "latitude":19.8135,
            "longitude":85.8312
        }
    ]