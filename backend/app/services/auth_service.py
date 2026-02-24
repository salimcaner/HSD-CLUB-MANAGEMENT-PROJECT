from datetime import timedelta
import secrets
from fastapi import HTTPException, status
from app.services.user_service import create_user, get_user_by_email
from app.core import security, config
from app.core.supabase_client import supabase


def login_user(email: str, password: str):

    # 1️⃣ Supabase Auth ile giriş yap (şifre kontrolü Supabase'de olur)
    auth_response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    if not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı!"
        )

    # 2️⃣ Profiles tablosundan ek bilgileri çek (first_name, last_name, role vs.)
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı profili bulunamadı!"
        )

    # 3️⃣ Token üret
    access_token_expires = timedelta(
        minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = security.create_access_token(
        subject=auth_response.user.id,
        role=user["role"],
        email=user["email"],
        expires_delta=access_token_expires
    )

    return access_token, user

# -------------------------
# Kullanıcı ekle 
# -------------------------
def invite_user(email: str, role: str):
    """
    Sadece email ve rol ile kullanıcı davet et
    """
    # 1️⃣ Supabase Auth'a davet gönder
    #Bu kısım **otomatik olarak:**
        #- ✅ Random şifre üretir
        #- ✅ Email gönderir
        #- ✅ Kullanıcı linke tıklayıp şifresini belirler
        
    try:
        response = supabase.auth.admin.invite_user_by_email(email)
    except Exception as e:
        error_str = str(e).lower()
        if "already registered" in error_str or "already exists" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{email} adresi zaten sistemde kayıtlı!"
            )
        raise HTTPException(status_code=400, detail="Davet gönderilemedi.")

    if not response.user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı davet edilirken hata oluştu."
        )

    # 2️⃣ Profiles tablosuna SADECE email ve rol ekle
    try:
        create_user(
            email=email,
            role=role,
            user_id=response.user.id
        )
    except Exception:
        supabase.auth.admin.delete_user(response.user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profil oluşturulamadı, davet iptal edildi."
        )
    
    return response.user

# -------------------------
# Şifre Değiştirme
# -------------------------
def change_password(user_id: str, old_password: str, new_password: str):
    """
    Kullanıcı kendi şifresini değiştirir
    """
    try:
        # Supabase'de şifre güncelleme
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"password": new_password}
        )
        return True
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Şifre değiştirilemedi: {str(e)}"
        )


# -------------------------
# Şifremi Unuttum (Email Gönder)
# -------------------------
def forgot_password(email: str):
    """
    Şifre sıfırlama linki gönder
    """
    try:
        # Kullanıcı var mı kontrol et
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bu email adresi sistemde kayıtlı değil!"
            )
        
        # Supabase şifre sıfırlama emaili gönder
        supabase.auth.reset_password_email(email)
        
        return {"message": f"{email} adresine şifre sıfırlama linki gönderildi."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email gönderilemedi: {str(e)}"
        )


# -------------------------
# Şifre Sıfırlama (Token ile)
# -------------------------
def reset_password(token: str, new_password: str):
    """
    Token ile şifre sıfırlama
    """
    try:
        # Supabase token doğrulama ve şifre güncelleme
        supabase.auth.update_user(
            {"password": new_password},
            {"access_token": token}
        )
        return {"message": "Şifreniz başarıyla değiştirildi!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Şifre sıfırlanamadı. Token geçersiz veya süresi dolmuş: {str(e)}"
        )