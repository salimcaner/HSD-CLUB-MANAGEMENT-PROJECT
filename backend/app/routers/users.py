from fastapi import APIRouter, Depends, HTTPException, status
from typing import List,Optional  
from app.schemas.user import User, UserUpdateAdmin, UserUpdateSelf
from app.services.user_service import (
    get_user_by_email,
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user,     
    get_filtered_users, 
    get_user_stats      
)
from app.core import security

router = APIRouter(prefix="/users", tags=["Users"])


# -------------------------
# Kendini Güncelle (İlk Giriş Zorunlu)
# -------------------------
@router.put("/me", response_model=User)
async def update_self(
    user_data: UserUpdateSelf,
    current_user = Depends(security.require_authenticated)
):
    """
    Kullanıcı kendi bilgilerini günceller
    İlk girişte profil tamamlamak ZORUNLU
    """
    updated_user = update_user(
        current_user.id, 
        user_data.dict(exclude_unset=True)
    )
    return updated_user

# -------------------------
# Kullanıcı Listele
# -------------------------
@router.get("/", response_model=List[User])
async def list_users(
    current_user = Depends(security.require_lider_or_above)
):
    """
    Tüm kullanıcıları listele (Yönetim yetkisi gerekli)
    """
    users = get_all_users()
    return users


# -------------------------
# Filtrelenmiş Kullanıcı Listesi
# -------------------------
@router.get("/filter", response_model=List[User])
async def filter_users(
    role: Optional[str] = None,
    department: Optional[str] = None,
    current_user = Depends(security.require_lider_or_above)
):
    """
    Rol veya departmana göre filtrelenmiş kullanıcı listesi
    Örnek: /users/filter?role=elci&department=bilgisayar
    """
    users = get_filtered_users(role=role, department=department)
    return users


# -------------------------
# Kullanıcı İstatistikleri
# -------------------------
@router.get("/stats")
async def get_stats(
    current_user = Depends(security.require_lider_or_above)
):
    """
    Sistem genelindeki kullanıcı istatistikleri
    Dashboard için kullanılabilir
    """
    stats = get_user_stats()
    return stats


# -------------------------
# Kullanıcı Detay
# -------------------------
@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_user = Depends(security.require_authenticated)
):
    """
    Belirli bir kullanıcıyı getir
    """
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı!"
        )
    return user


# -------------------------
# Kullanıcı Güncelle
# -------------------------
@router.put("/{user_id}", response_model=User)
async def update_user_endpoint(
    user_id: str,
    user_data: UserUpdateAdmin,
    current_user = Depends(security.require_authenticated) # <--- Sadece login olması yeterli
):
    """
    Kullanıcı bilgilerini güncelle
    (Kişi sadece KENDİ profilini güncelleyebilir, Yönetim ise HERKESİ güncelleyebilir)
    """
    
    # 1. YETKİ KONTROLÜ
    # Kullanıcının rolünü al
    role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    admin_roles = [security.UserRole.ELCI.value, security.UserRole.GENEL_SEKRETER.value, security.UserRole.ADMIN.value, security.UserRole.ELCI_YARDIMCISI.value, security.UserRole.KOMITE_LIDERI.value]
    
    is_owner = (str(current_user.id) == str(user_id))
    is_admin = (role_str in admin_roles)
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Güncelleme yetkiniz yok. Sadece kendi profilinizi veya Yönetim yetkiniz varsa diğer profilleri güncelleyebilirsiniz."
        )
    # 2. GÜNCELLEME İŞLEMİ
    updated_user = update_user(user_id, user_data.dict(exclude_unset=True))
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı!"
        )
        
    return updated_user


# -------------------------
# Kullanıcı Sil
# -------------------------
@router.delete("/{user_id}")
async def delete_user_endpoint(
    user_id: str,
    current_user = Depends(security.require_yonetim)
):
    """
    Kullanıcıyı sil (Sadece Yönetim yetkisi)
    """
    success = delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı!"
        )
    return {"message": "Kullanıcı başarıyla silindi!"}



