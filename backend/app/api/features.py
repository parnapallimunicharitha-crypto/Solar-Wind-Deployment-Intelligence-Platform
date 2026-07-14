from fastapi import APIRouter

router = APIRouter(
    prefix="/features",
    tags=["Features"]
)


@router.get("/")
def get_all_features():

    return {
        "message": "Return all feature records"
    }


@router.get("/{feature_id}")
def get_feature(feature_id: int):

    return {
        "message": f"Feature ID = {feature_id}"
    }