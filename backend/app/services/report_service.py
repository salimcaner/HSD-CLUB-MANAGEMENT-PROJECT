import uuid
import os
from typing import Optional
from fastapi import HTTPException
from app.core.supabase_client import get_supabase
from app.schemas.user import UserRole

supabase = get_supabase()
# -------------------------
#RAPOR YÜKLEME SERVİSİ
# -------------------------
def create_report_service(
    sender_id: str,
    report_name: str,
    report_type: str,
    project_name: str,
    privacy: str,
    file_bytes: bytes,
    filename: str,
    content_type: str
):
    try:
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        upload_response = supabase.storage.from_("reports").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": content_type}
        )
        
        public_url = supabase.storage.from_("reports").get_public_url(unique_filename)
        
        # 2. Veritabanına (Database) Kaydet
        report_data = {
            "report_name": report_name,
            "sender_id": sender_id,
            "report_type": report_type,
            "project_name": project_name, # Seçilmişse gelir, yoksa None olur (veya boş string)
            "privacy": privacy,
            "file_url": public_url,
            "status": "Pending" 
        }
        db_response = supabase.table("reports").insert(report_data).execute()
        
        if db_response.data:
            return db_response.data[0]
        else:
             raise Exception("Veritabanına kayıt başarısız.")
             
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rapor oluşturulurken hata: {str(e)}")
    
# -------------------------
#RAPOR LİSTELEME SERVİSİ
# -------------------------
def get_all_reports_service(user_role: str, search_name: str = None, limit: int = 50, offset: int = 0):
    try:
        query = supabase.table("reports").select("*, users!reports_sender_id_fkey(first_name, last_name, email)")
        
        # Yetki (Gizlilik) Kontrolü
        if user_role == "uye":
            query = query.in_("privacy", ["genel"])
            
        # Liderler ve İK "genel" ve "gizli" raporları görebilir
        elif user_role in [UserRole.DEPARTMAN_LIDERI.value,UserRole.INSAN_KAYNAKLARI.value,UserRole.ELCI.value,UserRole.GENEL_SEKRETER.value]: 
            query = query.in_("privacy", ["genel", "gizli"])
                
        elif user_role in [UserRole.ELCI.value, UserRole.GENEL_SEKRETER.value]:
            pass 
        else:
            query = query.in_("privacy", ["genel"])
     
        if search_name:
            query = query.ilike("report_name", f"%{search_name}%")
            
        end_index = offset + limit - 1
        query = query.range(offset, end_index)     
       
        response = query.execute()
        
       
        return response.data
    except Exception as e:
        raise Exception(f"Raporlar getirilirken hata: {str(e)}")
    
# -------------------------
#RAPOR durum güncelleme servisi
# -------------------------
def update_report_status_service(report_id: int, new_status: str):
    try:
        # Supabase'de `status` kolonunu güncelle
        response = supabase.table("reports").update(
            {"status": new_status}
        ).eq("id", report_id).execute()
        
        # Eğer rapor bulunamadıysa Supabase boş data döner
        if not response.data:
            return None
            
        return response.data[0] # Güncellenmiş rapor verisini dön
    except Exception as e:
        raise Exception(f"Rapor durumu güncellenirken hata: {str(e)}")


# -------------------------
#RAPOR SİLME SERVİSİ
# -------------------------
def delete_report_service(report_id: int, current_user_id: str, user_role: str): # <--- user_role parametresi eklendi
    try:
        response = supabase.table("reports").select("*").eq("id", report_id).execute()
        
        if not response.data:
             return {"success": False, "message": "Böyle bir rapor bulunamadı."}
             
        report_data = response.data[0]
        report_owner_id = report_data.get("sender_id") 
        
        #KİMLER SİLEBİLİR? (SAHİP VEYA YÖNETİM EKİBİ)
        admin_roles = [UserRole.ELCI.value, UserRole.GENEL_SEKRETER.value]
        
        is_owner = (report_owner_id == current_user_id)
        is_admin = (user_role in admin_roles)
        
        # Eğer ne sahibi ne de bir yönetici değilse ENGELLE
        if not (is_owner or is_admin):
             return {
                 "success": False, 
                 "message": "Silme yetkiniz yok. Sadece rapor sahibi veya Yönetim Ekibi (Elçi/Genel Sekreter) bu raporu silebilir."
             }
             
        file_url = report_data.get("file_url")
        if file_url:
            filename = file_url.split("/")[-1] 
            try:
                supabase.storage.from_("reports").remove([filename])
            except:
                pass
                
       
        supabase.table("reports").delete().eq("id", report_id).execute()
        
        return {"success": True, "message": "Rapor başarıyla silindi."}
    except Exception as e:
        raise Exception(f"Sistem hatası: {str(e)}")
    

# -------------------------
#RAPOR GÜNCELLEME SERVİSİ
# -------------------------
def update_report_service(
    report_id: int, 
    current_user_id: str,
    new_report_name: str,
    new_committee: str,
    new_report_type: str,
    new_privacy: str,
    new_project_name: Optional[str] = None, 
    new_file_bytes: Optional[bytes] = None, 
    new_filename: Optional[str] = None,
    new_content_type: Optional[str] = None
):
    try:
        response = supabase.table("reports").select("*").eq("id", report_id).execute()
        
        if not response.data:
             return {"success": False, "message": "Güncellenecek rapor bulunamadı."}
             
        report_data = response.data[0]
        report_owner_id = report_data.get("sender_id") 
        old_file_url = report_data.get("file_url")
        
        # 1. SAHİPLİK KONTROLÜ
        if report_owner_id != current_user_id:
             return {"success": False, "message": "Güncelleme yetkiniz yok. Sadece rapor sahibi güncelleyebilir."}
             
        updated_file_url = old_file_url  # Varsayılan olarak eski URL ile devam ederiz
        unique_filename = None
        
        if new_file_bytes and new_filename:
            unique_filename = f"{uuid.uuid4()}_{new_filename}"

            supabase.storage.from_("reports").upload(
                file=new_file_bytes,
                path=unique_filename,
                file_options={"content-type": new_content_type}
            )
            updated_file_url = supabase.storage.from_("reports").get_public_url(unique_filename)
       

        update_data = {
            "report_name": new_report_name,
            "committee": new_committee,
            "report_type": new_report_type,
            "project_name": new_project_name,
            "privacy": new_privacy,
            "file_url": updated_file_url,
            "status": "Pending" 
        }
        update_response = supabase.table("reports").update(update_data).eq("id", report_id).execute()
        
        if update_response.data:
             if new_file_bytes and new_filename and old_file_url:
                 old_filename = old_file_url.split("/")[-1] 
                 try:
                     supabase.storage.from_("reports").remove([old_filename])
                 except Exception as e:
                     print(f"Uyarı: Eski dosya silinemedi: {str(e)}")
                     
             return {"success": True, "message": "Rapor başarıyla güncellendi ve tekrar onaya gönderildi.", "data": update_response.data[0]}
        else:
             if unique_filename:
                 supabase.storage.from_("reports").remove([unique_filename])
                 
             return {"success": False, "message": "Veritabanı güncellemesi başarısız oldu."}
             
    except Exception as e:
        if unique_filename:
            try:
                supabase.storage.from_("reports").remove([unique_filename])
            except:
                pass 
                
        return {"success": False, "message": f"Güncelleme işlemi sırasında bir hata oluştu: {str(e)}"}