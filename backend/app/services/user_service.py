from fastapi import HTTPException, status
from app.core.supabase_client import supabase
from app.schemas.user import User


def get_user_by_email(email: str):
    response = supabase.table("profiles").select("*").eq("email", email).execute()
    
    if response.data:
        return response.data[0]
    return None



# -------------------------
# kullanıcı oluştur
# -------------------------
def create_user(email: str, first_name: str, last_name: str, role: str, department: str = None, class_: int = None, invite_token: str = None, university_department: str = None,user_id: str = None):
    user_data = {
        "id": user_id,   # auth.users id ile eşleşmeli
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "role": role,
        "department": department,
        "class": class_,
        "university_department": university_department,
    }
    response = supabase.table("profiles").insert(user_data).execute()

    if response.data:
        result = response.data[0]             # ← 1. DB'den gelen veriyi al
        if "class" in result:                 # ← 2. "class" varsa dönüştür
            result["class_"] = result.pop("class")
        return User(**result) 
    
    raise HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Profil oluşturulamadı! Kullanıcı davet edildi ama profil kaydedilemedi."
    )
