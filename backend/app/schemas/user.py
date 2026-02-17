from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum

# ==========================================
# ROLLER (Enum - Güvenli)
# ==========================================

class UserRole(str, Enum):
    """Kullanıcı rolleri - Değiştirilmez, güvenli"""
    ADMIN = "admin"
    ELCI = "elci"
    LIDER = "lider"
    UYE = "uye"
    MEZUN = "mezun"

# ==========================================
# BASE SCHEMAS
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole  # ← Enum kullan, string değil
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        """Rol validasyonu"""
        if isinstance(v, str):
            # String gelirse Enum'a çevir
            try:
                return UserRole(v)
            except ValueError:
                raise ValueError(f"Geçersiz rol: {v}. Geçerli roller: {[r.value for r in UserRole]}")
        return v

class User(UserBase):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True  # Pydantic v2
        use_enum_values = True  # Enum değerlerini string olarak dön

class UserInDB(User):
    hashed_password: str