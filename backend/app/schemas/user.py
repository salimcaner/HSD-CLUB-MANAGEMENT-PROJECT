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
    KOMITE_LIDERI = "komite_lideri"
    INSAN_KAYNAKLARI = "insan_kaynaklari"
    ELCI_YARDIMCISI = "elci_yardimcisi"
    UYE = "uye"
    ADMIN="admin"
    MEZUN="mezun"

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


    @field_validator('role', mode='before')
    @classmethod
    def validate_role(cls, v):
        """Rol validasyonu"""
        if isinstance(v, str):
            v_lower = v.lower()
            # Eğer enum içinde yoksa fallback olarak 'uye' veya admin ataması vb. yapılabilir.
            # Şimdilik sadece lower yapalım, enum kendisi hatalıysa yakalar.
            try:
                return UserRole(v_lower)
            except ValueError:
                # Geçersiz roller için varsayılan bir rol atanabilir veya hata fırlatılır.
                # 'Admin ' gibi boşluklu gelmişse strip yapalım.
                v_clean = v_lower.strip()
                try:
                    return UserRole(v_clean)
                except ValueError:
                    return v_clean # Enum hatası fırlamasına izin ver
        return v

    @field_validator('class_', mode='before')
    @classmethod
    def validate_class(cls, v):
        """Sınıf validasyonu, '-' veya boşluk gelirse None yap"""
        if isinstance(v, str):
            v_clean = v.strip()
            if v_clean in ('-', '', 'null', 'None'):
                return None
            try:
                return int(v_clean)
            except ValueError:
                return None
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

class UserUpdateAdmin(BaseModel):
    """Yönetim tarafından yapılan kısmi güncellemeler için"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    class_: Optional[int] = None
    university_department: Optional[str] = None
    class Config:
        populate_by_name = True