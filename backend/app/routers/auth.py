from fastapi import APIRouter
from app.schemas.auth import LoginRequest

router = APIRouter(prefix="/auth", tags=["Auth"])


from datetime import timedelta
from app.core import security, config

@router.post("/login")
async def login(request: LoginRequest):
    # Bu fonksiyon, kullanıcı giriş isteğini karşılar.
    # request: LoginRequest modeline uygun olarak gelen JSON verisini otomatik olarak doğrular.
    
    # [TODO] Burada kullanıcı doğrulama (authentication) işlemleri yapılacak.
    # [TODO] Veritabanından kullanıcı kontrolü yapılacak.
    # [TODO] Başarılı ise JWT token oluşturulup döndürülecek.
    
    # Örnek (Mock) Kullanıcı Verisi
    user_id = 1
    role = "student" # veya admin
    
    # Access Token süresini ayarlıyoruz.
    access_token_expires = timedelta(minutes=config.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Token oluşturuyoruz.
    access_token = security.create_access_token(
        subject=user_id,
        role=role,
        expires_delta=access_token_expires
    )
    
    # OAuth2 standardına uygun yanıt dönüyoruz.
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# Mevcut kullanıcı bilgisini getirme endpoint'
@router.get("/me")
async def get_current_user():
    # [TODO] Token doğrulama (dependency) eklenecek.
    # [TODO] Doğrulanmış kullanıcı bilgisi döndürülecek.
    
    return {
        "user_id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "role": "admin"
    }
