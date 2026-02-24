 # Kimlik Doğrulama Modülü --- Token, şifre ve kimlik ile ilgili bölüm.


from fastapi import APIRouter, Response, Depends
from app.schemas.auth import InviteRequest, LoginRequest,ChangePasswordRequest,ForgotPasswordRequest,ResetPasswordRequest
from app.services.auth_service import invite_user, login_user,change_password,forgot_password,reset_password
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
        "full_name": f"{user['first_name']} {user['last_name']}", # ← EKLE
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
        "full_name": f"{current_user.first_name} {current_user.last_name}",
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "department": current_user.department,
        "class": current_user.class_,
        "created_at": current_user.created_at,
        "university_department": current_user.university_department
    }

# -----------------------------
# Kullanıcı Ekleme (Sadece Email + Rol)
# -----------------------------
@router.post("/invite")
async def invite_endpoint(
    request: InviteRequest,
    current_user = Depends(security.require_lider_or_above)
):
    """
    Kullanıcı davet et (Sadece email ve rol)
    Kullanıcı ilk girişte kalan bilgileri kendisi dolduracak
    """
    user = invite_user(
        email=request.email,
        role=request.role
    )
    return {
        "message": f"{request.email} için davet gönderildi.",
        "note": "Kullanıcı ilk girişte şifre değiştirip profil bilgilerini tamamlamalı."
    }
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


# -------------------------
# Şifre Değiştirme
# -------------------------
@router.post("/change-password")
async def change_password_endpoint(
    request: ChangePasswordRequest,
    current_user = Depends(security.require_authenticated)
):
    """
    Kullanıcı kendi şifresini değiştirir
    """
    change_password(
        user_id=current_user.id,
        old_password=request.old_password,
        new_password=request.new_password
    )
    return {"message": "Şifreniz başarıyla değiştirildi!"}


# -------------------------
# Şifremi Unuttum
# -------------------------
@router.post("/forgot-password")
async def forgot_password_endpoint(request: ForgotPasswordRequest):
    """
    Şifre sıfırlama emaili gönder
    """
    result = forgot_password(request.email)
    return result


# -------------------------
# Şifre Sıfırlama
# -------------------------
@router.post("/reset-password")
async def reset_password_endpoint(request: ResetPasswordRequest):
    """
    Token ile şifre sıfırla
    """
    result = reset_password(request.token, request.new_password)
    return result
