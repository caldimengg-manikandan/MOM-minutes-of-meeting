from fastapi import APIRouter

router = APIRouter(
    prefix="/upload-trackers",
    tags=["Upload Trackers"]
)

@router.get("/")
def list_trackers():
    return []
