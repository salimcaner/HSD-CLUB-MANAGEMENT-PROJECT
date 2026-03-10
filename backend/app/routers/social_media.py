from fastapi import APIRouter, HTTPException, Path, Query, Depends, status
from typing import Optional
from datetime import datetime
from app.services.social_media_service import (
    create_social_post_service,
    get_all_social_posts_service,
    get_social_post_by_id_service,
    update_social_post_service,
    delete_social_post_service,
    get_social_stats_service
)
from app.core.security import get_current_user
from app.schemas.user import UserInDB

router = APIRouter(prefix="/social-media", tags=["Social Media"])


def require_social_permission(current_user: UserInDB = Depends(get_current_user)):
    role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    if role_str in ["uye", "mezun"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlemi gerçekleştirmek için yetkiniz yok."
        )
    return current_user


@router.post("/")
async def create_social_post(
    platform: str = Query(..., description="instagram, medium, youtube, linkedin"),
    post_date: datetime = Query(...),
    likes: int = Query(0),
    comments: int = Query(0),
    views: int = Query(0),
    title: Optional[str] = Query(None),
    post_url: Optional[str] = Query(None),
    current_user: UserInDB = Depends(require_social_permission)
):
    try:
        result = create_social_post_service(
            platform=platform,
            post_date=post_date.isoformat(),
            likes=likes,
            comments=comments,
            views=views,
            added_by=str(current_user.id),
            title=title,
            post_url=post_url
        )
        return {"message": "Post başarıyla eklendi.", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_all_social_posts(
    platform: Optional[str] = Query(None, description="instagram, medium, youtube, linkedin"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        posts = get_all_social_posts_service(platform=platform, limit=limit, offset=offset)
        return {"message": "Postlar listelendi.", "total": len(posts), "data": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_social_stats(
    platform: Optional[str] = Query(None, description="instagram, medium, youtube, linkedin"),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        stats = get_social_stats_service(platform=platform)
        return {"message": "İstatistikler getirildi.", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{post_id}")
async def get_social_post_detail(
    post_id: int = Path(...),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        post = get_social_post_by_id_service(post_id)
        if not post:
            raise HTTPException(status_code=404, detail="Post bulunamadı.")
        return {"message": "Post detayı getirildi.", "data": post}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{post_id}")
async def update_social_post(
    post_id: int = Path(...),
    platform: str = Query(...),
    post_date: datetime = Query(...),
    likes: int = Query(0),
    comments: int = Query(0),
    views: int = Query(0),
    title: Optional[str] = Query(None),
    post_url: Optional[str] = Query(None),
    current_user: UserInDB = Depends(require_social_permission)
):
    try:
        role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
        result = update_social_post_service(
            post_id=post_id,
            user_role=role_str,
            platform=platform,
            post_date=post_date.isoformat(),
            likes=likes,
            comments=comments,
            views=views,
            title=title,
            post_url=post_url
        )
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{post_id}")
async def delete_social_post(
    post_id: int = Path(...),
    current_user: UserInDB = Depends(require_social_permission)
):
    try:
        role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
        result = delete_social_post_service(post_id=post_id, user_role=role_str)
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))