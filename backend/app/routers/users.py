from fastapi import APIRouter, Depends, HTTPException, status
from typing import List,Optional  
from app.schemas.user import User, UserBase,UserUpdateSelf
from app.services.user_service import (
    get_user_by_email,
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user,
    deactivate_user,    
    activate_user,      
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
    current_user = Depends(security.require_admin_or_elci)
):
    """
    Tüm kullanıcıları listele (Admin ve Elçi yetkisi gerekli)
    """
    users = get_all_users()
    return users


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
    user_data: UserBase,
    current_user = Depends(security.require_admin_or_elci)
):
    """
    Kullanıcı bilgilerini güncelle (Admin ve Elçi yetkisi gerekli)
    """
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
    current_user = Depends(security.require_admin)
):
    """
    Kullanıcıyı sil (Sadece Admin yetkisi)
    """
    success = delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı!"
        )
    return {"message": "Kullanıcı başarıyla silindi!"}

# -------------------------
# Kullanıcıyı Deaktive Et
# -------------------------
@router.put("/{user_id}/deactivate", response_model=User)
async def deactivate_user_endpoint(
    user_id: str,
    current_user = Depends(security.require_admin_or_elci)
):
    """
    Kullanıcıyı pasif yap (silmeden devre dışı bırak)
    Mezunlar için kullanılabilir
    """
    deactivated_user = deactivate_user(user_id)
    if not deactivated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı!"
        )
    return deactivated_user


# -------------------------
# Kullanıcıyı Aktive Et
# -------------------------
@router.put("/{user_id}/activate", response_model=User)
async def activate_user_endpoint(
    user_id: str,
    current_user = Depends(security.require_admin_or_elci)
):
    """
    Pasif kullanıcıyı tekrar aktif yap
    """
    activated_user = activate_user(user_id)
    if not activated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı!"
        )
    return activated_user


# -------------------------
# Filtrelenmiş Kullanıcı Listesi
# -------------------------
@router.get("/filter", response_model=List[User])
async def filter_users(
    role: Optional[str] = None,
    department: Optional[str] = None,
    current_user = Depends(security.require_admin_or_elci)
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
    current_user = Depends(security.require_admin_or_elci)
):
    """
    Sistem genelindeki kullanıcı istatistikleri
    Dashboard için kullanılabilir
    """
    stats = get_user_stats()
    return stats
