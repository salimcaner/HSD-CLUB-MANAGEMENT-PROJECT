from fastapi import APIRouter, HTTPException, Depends, status
from app.services.community_service import get_community_members_service
from app.core.security import get_current_user
from app.schemas.user import UserInDB

router = APIRouter(prefix="/community", tags=["Community"])


@router.get("/")
async def get_community_members(
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        members = get_community_members_service()
        return {
            "message": "Topluluk üyeleri listelendi.",
            "total": len(members),
            "data": members
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )