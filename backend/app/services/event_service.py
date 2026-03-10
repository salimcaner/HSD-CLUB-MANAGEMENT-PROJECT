import uuid
from typing import Optional
from app.schemas.user import UserRole
from fastapi import HTTPException
from app.core.supabase_client import get_supabase
supabase = get_supabase()


# -------------------------
# ETKİNLİK OLUŞTURMA SERVİSİ
# -------------------------
def create_event_service(
    title: str,
    description: str,
    event_date: str,
    location: str,
    committee: str,
    event_type: str,            # <-- YENİ EKLENEN
    participant_count: Optional[int], # <-- YENİ EKLENEN
    created_by: str,
    file_bytes: Optional[bytes] = None, # <-- Artık zorunlu değil (Default resim için)
    filename: Optional[str] = None,
    content_type: Optional[str] = None,
    default_image_url: Optional[str] = None # <-- YENİ EKLENEN (Zorunlu)
):
    try:
        # Varsayılan olarak default resim linki atıyoruz
        public_url = default_image_url
        
        # Eğer kullanıcı ilk aşamada yine de dosya yüklediyse default'u ezip gerçek resmi Supabase'e atıyoruz
        if file_bytes and filename:
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            supabase.storage.from_("event-images").upload(
                file=file_bytes,
                path=unique_filename,
                file_options={"content-type": content_type}
            )
            public_url = supabase.storage.from_("event-images").get_public_url(unique_filename)
            
        # 3. Veritabanına Yaz
        event_data = {
            "title": title,
            "description": description,
            "event_date": event_date,
            "location": location,
            "committee": committee,
            "event_type": event_type,                # <-- YENİ
            "participant_count": participant_count,  # <-- YENİ
            "image_url": public_url,                 # Resim linki
            "created_by": created_by
        }
        
        db_response = supabase.table("events").insert(event_data).execute()
        
        if db_response.data:
            return db_response.data[0]
        else:
             raise Exception("Etkinlik veritabanına kayıt başarısız oldu.")
             
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Etkinlik oluşturulurken hata: {str(e)}")
    
# -------------------------
# ETKİNLİKLERİ LİSTELEME VE FİLTRELEME SERVİSİ
# -------------------------
def get_all_events_service(
    limit: int = 50, 
    offset: int = 0,
    search_name: Optional[str] = None   
):
    try:
        query = supabase.table("events").select("*, profiles!inner(first_name, last_name)").order("created_at", desc=True)
        
        if search_name:
            query = query.ilike("title", f"%{search_name}%")
            
        end_index = offset + limit - 1
        query = query.range(offset, end_index)
        
        response = query.execute()
        
        return response.data
    except Exception as e:
        raise Exception(f"Etkinlikler getirilirken hata: {str(e)}")
# -------------------------
# TEK BİR ETKİNLİĞİ DETAYLI GÖRME SERVİSİ
# -------------------------
def get_event_by_id_service(event_id: int):
    try:
        response = supabase.table("events").select("*, profiles!inner(first_name, last_name)").eq("id", event_id).execute()
        
        if not response.data:
            return None
            
        return response.data[0]
    except Exception as e:
        raise Exception(f"Etkinlik detayı getirilirken hata: {str(e)}")


# -------------------------
# ETKİNLİK GÜNCELLEME SERVİSİ
# -------------------------
def update_event_service(
    event_id: int, 
    current_user_id: str,
    user_role: str, 
    title: str,
    description: str,
    event_date: str,
    location: str,
    committee: str,
    event_type: str,                   # <-- YENİ
    participant_count: Optional[int],  # <-- YENİ
    new_file_bytes: Optional[bytes] = None, 
    new_filename: Optional[str] = None,
    new_content_type: Optional[str] = None
):
    unique_filename = None 
    try:
        response = supabase.table("events").select("*").eq("id", event_id).execute()
        
        if not response.data:
             return {"success": False, "message": "Güncellenecek etkinlik bulunamadı."}
             
        event_data = response.data[0]
        event_owner_id = event_data.get("created_by") 
        old_image_url = event_data.get("image_url")
        
        # --- GÜVENLİK ---
        admin_roles = [UserRole.ELCI.value, UserRole.GENEL_SEKRETER.value, UserRole.ADMIN.value, UserRole.ELCI_YARDIMCISI.value, UserRole.KOMITE_LIDERI.value] 
        is_owner = (event_owner_id == current_user_id)
        is_admin = (user_role in admin_roles)
        
        if not (is_owner or is_admin):
             return {
                 "success": False, 
                 "message": "Bu etkinliği güncelleme yetkiniz yok. Sadece etkinliği oluşturan kişi veya Yönetim Ekibi değişiklik yapabilir."
             }
             
        # --- FOTOĞRAF GÜNCELLEME (Frontend'den yeni resim gelmişse) ---
        updated_image_url = old_image_url  
        
        if new_file_bytes and new_filename:
            unique_filename = new_filename
            
            supabase.storage.from_("event-images").upload(
                file=new_file_bytes,
                path=unique_filename,
                file_options={"content-type": new_content_type}
            )
            updated_image_url = supabase.storage.from_("event-images").get_public_url(unique_filename)
       
        # --- VERİTABANI GÜNCELLEMESİ ---
        update_data = {
            "title": title,
            "description": description,
            "event_date": event_date,
            "location": location,
            "committee": committee,
            "event_type": event_type,                # <-- Yeni gönderilen tür değeri
            "participant_count": participant_count,  # <-- Etkinlik bitince girilen sayı
            "image_url": updated_image_url
        }
        
        update_response = supabase.table("events").update(update_data).eq("id", event_id).execute()
        
        # --- Kotayı Koru --- 
        if update_response.data and old_image_url:
             # Eğer "event-images" içeren bir resimse storage'dan silsin. (Default komite resimlerini silmemesi için bu kontrol önemli)
             if new_file_bytes and new_filename and "event-images" in old_image_url: 
                 old_filename = old_image_url.split("/")[-1] 
                 try:
                     supabase.storage.from_("event-images").remove([old_filename])
                 except Exception as e:
                     print(f"Uyarı: Eski fotoğraf Storage'dan silinemedi: {str(e)}")
                     
        if update_response.data:
             return {"success": True, "message": "Etkinlik başarıyla güncellendi.", "data": update_response.data[0]}
        else:
             if unique_filename:
                 supabase.storage.from_("event-images").remove([unique_filename])
             return {"success": False, "message": "Veritabanı güncellemesi başarısız oldu."}
             
    except Exception as e:
        if unique_filename:
            try:
                supabase.storage.from_("event-images").remove([unique_filename])
            except:
                pass 
        return {"success": False, "message": f"Güncelleme işlemi sırasında sistem hatası oluştu: {str(e)}"}


# -------------------------
# ETKİNLİK SİLME SERVİSİ
# -------------------------
def delete_event_service(event_id: int, current_user_id: str, user_role: str): 
    try:
        response = supabase.table("events").select("*").eq("id", event_id).execute()
        
        if not response.data:
             return {"success": False, "message": "Silinmek istenen etkinlik bulunamadı."}
             
        event_data = response.data[0]
        event_owner_id = event_data.get("created_by") 
        
        # --- GÜVENLİK ---
        admin_roles = [UserRole.ELCI.value, UserRole.GENEL_SEKRETER.value, UserRole.ADMIN.value, UserRole.ELCI_YARDIMCISI.value, UserRole.KOMITE_LIDERI.value]
        
        is_owner = (event_owner_id == current_user_id)
        is_admin = (user_role in admin_roles)
        
        if not (is_owner or is_admin):
             return {
                 "success": False, 
                 "message": "Bu etkinliği silme yetkiniz yok. Sadece etkinliği oluşturan kişi veya Yönetim Ekibi bunu silebilir."
             }
             
        # --- FOTOĞRAF SİLME ---
        image_url = event_data.get("image_url")
        if image_url:
            filename = image_url.split("/")[-1] 
            try:
                supabase.storage.from_("event-images").remove([filename])
            except:
                pass 
                
        # --- VERİTABANI SİLME ---
        supabase.table("events").delete().eq("id", event_id).execute()
        
        return {"success": True, "message": "Etkinlik ve ona bağlı dosya başarıyla silindi."}
        
    except Exception as e:
        raise Exception(f"Sistem hatası: {str(e)}")