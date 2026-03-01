from fastapi import HTTPException, status
from app.core.supabase_client import supabase
from app.schemas.user import User


def get_user_by_email(email: str):
    try:
        response = supabase.table("profiles").select("*").eq("email", email).execute()
    
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"HATA- get_user_by_email fonksiyonu çöktü: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kullanıcı bilgisi alınırken hata oluştu!"
        )


# -------------------------
# kullanıcı oluştur
# -------------------------
def create_user(
    email: str, 
    role: str, 
    user_id: str,
    first_name: str = None,
    last_name: str = None,
    department: str = None,
    class_: int = None,
    university_department: str = None
):
    """
    Kullanıcı profili oluştur
    - Invite: Sadece email + role
    - Self Update: Diğer bilgileri sonra ekler
    """
    user_data = {
        "id": user_id,
        "email": email,
        "role": role,
        "first_name": first_name,
        "last_name": last_name,
        "department": department,
        "class": class_,
        "university_department": university_department,
    }
    
    response = supabase.table("profiles").insert(user_data).execute()

    if response.data:
        result = response.data[0]
        if "class" in result:
            result["class_"] = result.pop("class")
        return User(**result)
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Profil oluşturulamadı!"
    )


# -------------------------
# Tüm Kullanıcıları Getir
# -------------------------
def get_all_users():
    try:
        response = supabase.table("profiles").select("*").execute()
    
        if response.data:
            users = []
            for user_dict in response.data:
                if "class" in user_dict:
                    user_dict["class_"] = user_dict.pop("class")
                users.append(User(**user_dict))
            return users
        return []
    except Exception as e:
        print(f"HATA - Kullanıcılar çekilirken: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Kullanıcı listesi şu an alınamıyor, daha sonra tekrar deneyin."
        )



# -------------------------
# ID ile Kullanıcı Getir
# -------------------------
def get_user_by_id(user_id: str):
    response = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    if response.data:
        result = response.data[0]
        if "class" in result:
            result["class_"] = result.pop("class")
        return User(**result)
    return None


# -------------------------
# Kullanıcı Güncelle
# -------------------------
def update_user(user_id: str, user_data: dict):
    # class_ → class dönüşümü
    if "class_" in user_data:
        user_data["class"] = user_data.pop("class_")
    
    response = supabase.table("profiles").update(user_data).eq("id", user_id).execute()
    
    if response.data:
        result = response.data[0]
        if "class" in result:
            result["class_"] = result.pop("class")
        return User(**result)
    return None


# -------------------------
# Kullanıcı Sil
# -------------------------
def delete_user(user_id: str):
    try:
        # 1. Profiles tablosundan sil
        supabase.table("profiles").delete().eq("id", user_id).execute()
        
        # 2. Auth'dan da sil
        supabase.auth.admin.delete_user(user_id)
        
        return True
    except Exception:
        return False
    

    # -------------------------
# Kullanıcıyı Deaktive Et
# -------------------------
def deactivate_user(user_id: str):
    """
    Kullanıcıyı pasif yap (silmeden devre dışı bırak)
    Mezunlar için kullanılabilir
    """
    response = supabase.table("profiles").update({"is_active": False}).eq("id", user_id).execute()
    
    if response.data:
        result = response.data[0]
        if "class" in result:
            result["class_"] = result.pop("class")
        return User(**result)
    return None


# -------------------------
# Kullanıcıyı Aktive Et
# -------------------------
def activate_user(user_id: str):
    """
    Pasif kullanıcıyı tekrar aktif yap
    """
    response = supabase.table("profiles").update({"is_active": True}).eq("id", user_id).execute()
    
    if response.data:
        result = response.data[0]
        if "class" in result:
            result["class_"] = result.pop("class")
        return User(**result)
    return None


# -------------------------
# Filtrelenmiş Kullanıcı Listesi
# -------------------------
def get_filtered_users(role: str = None, department: str = None):
    """
    Rol veya departmana göre filtrelenmiş kullanıcı listesi
    """
    query = supabase.table("profiles").select("*")
    
    # Rol filtresi
    if role:
        query = query.eq("role", role)
    
    # Departman filtresi
    if department:
        query = query.eq("department", department)
    
    response = query.execute()
    
    if response.data:
        users = []
        for user_dict in response.data:
            if "class" in user_dict:
                user_dict["class_"] = user_dict.pop("class")
            users.append(User(**user_dict))
        return users
    return []


# -------------------------
# Kullanıcı İstatistikleri
# -------------------------
def get_user_stats():
    """
    Sistem genelindeki kullanıcı istatistikleri
    Kaç admin, elçi, lider, üye, mezun var?
    """
    response = supabase.table("profiles").select("role").execute()
    
    if not response.data:
        return {
            "total": 0,
            "admin": 0,
            "elci": 0,
            "lider": 0,
            "uye": 0,
            "mezun": 0
        }
    
    stats = {
        "total": len(response.data),
        "admin": 0,
        "elci": 0,
        "lider": 0,
        "uye": 0,
        "mezun": 0
    }
    
    for user in response.data:
        role = user.get("role", "").lower()
        if role in stats:
            stats[role] += 1
    
    return stats