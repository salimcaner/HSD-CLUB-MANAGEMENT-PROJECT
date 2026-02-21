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
   
    existing_user = get_user_by_email(email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{email} adresi zaten sistemde kayıtlı!"
        )
    # 1️⃣ Supabase Auth tarafında kullanıcıyı invite et
    response = supabase.auth.admin.invite_user_by_email(email)

    if not response.user:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı davet edilirken hata oluştu."
        )

    #2️⃣ Profiles tablosuna ekle
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
    return response.user