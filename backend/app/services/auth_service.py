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
def invite_user(email: str, first_name: str, last_name: str, role: str, department: str = None, class_: int = None, university_department: str = None):
    #Önce kontrol et
    try:
        users_response = supabase.auth.admin.list_users()
        users = users_response if isinstance(users_response, list) else []
        for u in users:
            if u.email == email:
                raise HTTPException(
                    status_code=409,
                    detail=f"{email} zaten auth sisteminde kayıtlı!"
                )
    except HTTPException:
        raise
    except Exception:
        pass
    
    try:
        response = supabase.auth.admin.invite_user_by_email(email)
    except Exception as e:
        print(f"!!! SUPABASE DAVET HATASI: {str(e)}")
        print(f"!!! HATA TİPİ: {type(e).__name__}")
        print(f"!!! HATA DETAYI: {repr(e)}")
        print(f"!!! HATA ARGS: {e.args}")
        
        # Eğer httpx hatası ise detayları yazdır
        if hasattr(e, 'response'):
            print(f"!!! RESPONSE STATUS: {e.response.status_code if hasattr(e.response, 'status_code') else 'N/A'}")
            print(f"!!! RESPONSE BODY: {e.response.text if hasattr(e.response, 'text') else 'N/A'}")
        
        error_str = str(e).lower()
        if "already registered" in error_str or "already exists" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{email} adresi zaten sistemde kayıtlı!"
            )
        raise HTTPException(status_code=400, detail=f"Davet gönderilemedi: {str(e)}")

   
    if not response.user:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı davet edilirken hata oluştu."
        )
    
    #2️⃣ Profiles tablosuna ekle — hata olursa Auth'dan da sil (rollback)
    try:
        create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            department=department,
            class_=class_,
            university_department=university_department,
            user_id=response.user.id
        )
    except Exception as e:
        # Hatanın ne olduğunu terminale (Uvicorn loguna) yazdırıyoruz
        print(f"!!! PROFİL OLUŞTURMA HATASI: {str(e)}")
        supabase.auth.admin.delete_user(response.user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profil oluşturulamadı, davet iptal edildi. Lütfen tekrar deneyin."
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
# Şifremi Unuttum
# -------------------------
def forgot_password(email: str):
    """
    Şifre sıfırlama linki gönder
    """
    try:
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bu email sistemde kayıtlı değil!"
            )
        
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
# Şifre Sıfırlama
# -------------------------
def reset_password(token: str, new_password: str):
    """
    Token ile şifre sıfırla
    """
    try:
        supabase.auth.update_user(
            {"password": new_password},
            {"access_token": token}
        )
        return {"message": "Şifreniz başarıyla değiştirildi!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Şifre sıfırlanamadı: {str(e)}"
        )