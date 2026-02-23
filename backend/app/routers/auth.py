from fastapi import APIRouter, Response, Depends
from app.schemas.auth import InviteRequest, LoginRequest
from app.services.auth_service import invite_user, login_user
from app.core import security

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
async def login(request: LoginRequest, response: Response):

    # Service çağır
    access_token, user = login_user(
        email=request.email,
        password=request.password
    )

    # Cookie set (HTTP işi → router)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=1800,
        samesite="lax"
    )

    # JSON response
    return {
    "access_token": access_token,
    "token_type": "bearer",
    "user": {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"],
    }
}

@router.get("/me")
async def get_current_user_info(
    current_user = Depends(security.get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "department": current_user.department,
        "class": current_user.class_,
        "created_at": current_user.created_at,
        "university_department": current_user.university_department
    }

# -----------------------------
# kullanıcı ekleme endpoint
# -----------------------------

@router.post("/invite")
async def invite_endpoint(request: InviteRequest,
    current_user = Depends(security.require_lider_or_above)): # Sadece lider ve üzeri davet atabilir):
   
    user = invite_user(
        email=request.email,
        first_name=request.first_name,
        last_name=request.last_name,
        role=request.role,
        department=request.department,
        class_=request.class_,
        university_department=request.university_department
    )
    return {"message": f"{request.email} için davet gönderildi."}

# -------------------------
# Logout endpoint
# -------------------------
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax"
    )
    return {"message": "Başarıyla çıkış yapıldı."}