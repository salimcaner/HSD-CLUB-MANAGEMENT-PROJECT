from fastapi import HTTPException, status
from app.schemas.user import User
from app.core.config import settings
from app.core.supabase_client import get_supabase
import requests

supabase = get_supabase()


def get_user_by_email(email: str):
    response = supabase.table("profiles").select("*").eq("email", email).execute()
    
    if response.data:
        return response.data[0]
    return None



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
    supabase = get_supabase()
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
    response = supabase.table("profiles").select("*").execute()
    
    if response.data:
        users = []
        for user_dict in response.data:
            if "class" in user_dict:
                user_dict["class_"] = user_dict.pop("class")
            users.append(User(**user_dict))
        return users
    return []


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
        # Supabase Profiles tablosundan sil
        supabase.table("profiles").delete().eq("id", user_id).execute()
        
        # Supabase Auth'dan kalıcı sil
        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        headers = {
            "apikey": settings.SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        resp = requests.delete(url, headers=headers)
        
        # Gerekirse hata logu görmek için:
        # if resp.status_code >= 400: print("Auth silinirken uyarı:", resp.text)
        
        return True
    except Exception as e:
        print("Kullanıcı silinirken hata:", str(e))
        return False



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
            "komite_lideri": 0,
            "insan_kaynaklari": 0,
            "elci_yardimcisi": 0,
            "genel_sekreter": 0,
            "uye": 0,
            "mezun": 0
        }
    
    stats = {
        "total": len(response.data),
        "admin": 0,
        "elci": 0,
        "komite_lideri": 0,
        "insan_kaynaklari": 0,
        "elci_yardimcisi": 0,
        "genel_sekreter": 0,
        "uye": 0,
        "mezun": 0
    }
    
    for user in response.data:
        role = user.get("role", "").lower()
        if role in stats:
            stats[role] += 1
    
    return stats