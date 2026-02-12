from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# schemes=["bcrypt"]: Şifreleme algoritması olarak Bcrypt kullanıyoruz.
# deprecated="auto": Eski şifreleme yöntemlerini otomatik olarak güncellemeyi sağlar.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:

    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT (JSON Web Token) oluşturur.
    
    Args:
        subject (Union[str, Any]): Token'ın konusu (genellikle kullanıcı ID'si).
        role (str): Kullanıcının rolü (örn: admin, student).
        expires_delta (Optional[timedelta]): Token'ın geçerlilik süresi. Belirtilmezse varsayılan değer kullanılır.
        
    Returns:
        str: Oluşturulan encoded JWT string'i.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Varsayılan süre ayarı config dosyasından alınır.
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # JWT payload'ı hazırlanır.
    # sub: Subject (Kullanıcı ID)
    # user_id: Kullanıcı ID (Açıkça belirtmek için)
    # role: Kullanıcı rolü
    # exp: Son kullanma tarihi
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "user_id": str(subject),
        "role": role
    }
    
    # Token şifrelenir ve string olarak döndürülür.
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
