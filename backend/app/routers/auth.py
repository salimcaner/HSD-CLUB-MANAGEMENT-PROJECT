from fastapi import APIRouter, HTTPException, status, Response, Depends
from datetime import timedelta
from app.schemas.auth import LoginRequest
from app.core import security, config
from app.services.mock_db import get_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
async def login(request: LoginRequest, response: Response):
    """
    Kullanıcı girişi - Email ve şifre kontrolü, JWT token üretimi
    """
    
    # 1. Kullanıcıyı veritabanından bul
    user = get_user(request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı!",
        )
    
    # 2. Şifre kontrolü
    if not security.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı!",
        )
    
    # 3. Hesap aktif mi kontrolü
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız aktif değil!",
        )
    
    # 4. Access Token oluştur
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = security.create_access_token(
        subject=user.id,
        role=user.role,
        expires_delta=access_token_expires
    )
    
    # 5. Cookie'ye kaydet (Swagger için otomatik authorize)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=1800,  # 30 dakika
        samesite="lax"
    )
    
    # 6. JSON döndür (Frontend için)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }
    }

@router.get("/me")
async def get_current_user_info(current_user = Depends(security.get_current_user)):
    """
    Mevcut kullanıcı bilgisini getir (Token'dan)
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }