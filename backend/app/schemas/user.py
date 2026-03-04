from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum

# ==========================================
# ROLLER (Enum - Güvenli)
# ==========================================

class UserRole(str, Enum):
    """Kullanıcı rolleri - Değiştirilmez, güvenli"""
    GENEL_SEKRETER = "genel_sekreter"
    ELCI = "elci"
    DEPARTMAN_LIDERI = "departman_lideri"
    INSAN_KAYNAKLARI = "insan_kaynaklari"
    UYE = "uye"


# ==========================================
# BASE SCHEMAS
# ==========================================

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole
    department: Optional[str] = None
    class_: Optional[int] = None
    university_department: Optional[str] = None


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
    class Config:
        populate_by_name = True   # class_ ile class eşleşsin 



class User(UserBase):
    id: str  #uuid
    created_at: Optional[str] = None  # ISO formatında tarih

    class Config:
        from_attributes = True  # Pydantic v2
        use_enum_values = True  # Enum değerlerini string olarak dön
        populate_by_name = True   # class_ ile class eşleşsin
class UserInDB(User):
    pass


class UserUpdateSelf(BaseModel):
    """Kullanıcı kendini güncellerken"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    class_: Optional[int] = None
    university_department: Optional[str] = None
    
    class Config:
        populate_by_name = True