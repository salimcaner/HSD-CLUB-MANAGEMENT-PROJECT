from datetime import datetime, timedelta
from typing import Optional, Union, Any, List
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from app.core.config import settings
from app.schemas.user import UserInDB, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer(auto_error=False)  # ← Cookie için auto_error=False

# ==========================================
# ŞİFRE FONKSİYONLARI
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ==========================================
# JWT TOKEN
# ==========================================

def create_access_token(
    subject: Union[str, Any], 
    role: str, 
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "user_id": str(subject),
        "role": role
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token doğrulanamadı!",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ==========================================
# DEPENDENCY - CURRENT USER (Cookie + Header Desteği)
# ==========================================

async def get_current_user(
    request: Request,
    credentials: Optional[Any] = Depends(security_scheme)
) -> UserInDB:
    """Token'dan mevcut kullanıcıyı çıkar (Header veya Cookie)"""
    from app.schemas.user import UserInDB
    from app.services.mock_db import get_user_by_id

    token = None
    
    # 1. Önce Header'dan token al (Frontend)
    if credentials:
        token = credentials.credentials
    
    # 2. Yoksa Cookie'den al (Swagger)
    if not token:
        cookie_token = request.cookies.get("access_token")
        if cookie_token:
            token = cookie_token.replace("Bearer ", "")
    
    # 3. Hala yoksa hata
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token bulunamadı!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token decode
    payload = decode_access_token(token)
    
    user_id: str = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token geçersiz!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Kullanıcı bul
    user_dict = get_user_by_id(int(user_id))
    
    if user_dict is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı!"
        )
    
    user = UserInDB(**user_dict)
    
    # Aktif mi kontrolü
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız aktif değil!"
        )
    
    return user

# ==========================================
# DEPENDENCY - ROL KONTROLÜ (Güvenli)
# ==========================================

def require_roles(allowed_roles: List[UserRole]):
    """
    Belirli rollere izin ver
    
    Kullanım:
    @router.get("/admin-only")
    async def admin_only(user = Depends(require_roles([UserRole.ADMIN]))):
        ...
    """
    async def role_checker(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
        # String'e çevir (çünkü DB'den string geliyor)
        user_role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
        
        # İzin verilen roller
        allowed_role_values = [role.value for role in allowed_roles]
        
        if user_role_str not in allowed_role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için {', '.join(allowed_role_values)} yetkisi gerekli!"
            )
        return current_user
    
    return role_checker

# ==========================================
# HAZIR DEPENDENCY'LER (Kolaylık için)
# ==========================================

# Sadece Admin
require_admin = require_roles([UserRole.ADMIN])

# Admin veya Elçi
require_admin_or_elci = require_roles([UserRole.ADMIN, UserRole.ELCI])

# Lider ve üstü (Admin, Elçi, Lider)
require_lider_or_above = require_roles([UserRole.ADMIN, UserRole.ELCI, UserRole.LIDER])

# Herkes (login olmuş)
require_authenticated = get_current_user