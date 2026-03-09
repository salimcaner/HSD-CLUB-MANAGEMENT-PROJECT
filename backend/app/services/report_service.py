import uuid
import os
from typing import Optional
from fastapi import HTTPException
from app.core.supabase_client import get_supabase
from app.schemas.user import UserRole

supabase = get_supabase()

# -------------------------
# RAPOR YÜKLEME SERVİSİ
# -------------------------
def create_report_service(
    sender_id: str,
    report_name: str,
    committee:str,
    report_type: str,
    project_name: str,
    privacy: str,
    file_bytes: bytes,
    filename: str,
    content_type: str
):
    try:
        safe_filename = filename.replace(" ", "_").replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c").replace("İ", "I").replace("Ğ", "G").replace("Ü", "U").replace("Ş", "S").replace("Ö", "O").replace("Ç", "C")
            
        unique_filename = f"{uuid.uuid4()}_{safe_filename}"
        
        
        upload_response = supabase.storage.from_("reports").upload(
            file=file_bytes,
            path=unique_filename,
            file_options={"content-type": content_type}
        )
        
        public_url = supabase.storage.from_("reports").get_public_url(unique_filename)
        
        # 3. Veritabanına (Database) Kaydet
        report_data = {
            "report_name": report_name,
            "sender_id": sender_id,
            "committee": committee,
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
# RAPOR LİSTELEME SERVİSİ
# -------------------------
def get_all_reports_service(user_role: str, current_user_id: str, search_name: str = None, limit: int = 50, offset: int = 0):
    try:
        query = supabase.table("reports").select("*, profiles!reports_sender_id_fkey(first_name, last_name, email)")
        
        # Yetki (Gizlilik) Kontrolü ve SAHİPLİK Kontrolü (Aynı Anda)
        if user_role == "uye" or user_role == UserRole.UYE.value:
            # Rapor 'genel' ise VEYA raporu yatatan benim id'mse bana göster.
            query = query.or_(f"privacy.eq.genel,sender_id.eq.{current_user_id}")
            
        # Çok gizli raporlar dahil TÜM raporları görebilenler
        elif user_role in [UserRole.ELCI.value, UserRole.GENEL_SEKRETER.value, UserRole.ADMIN.value, UserRole.ELCI_YARDIMCISI.value]:
            pass 
            
        # Sadece genel ve gizli raporları görebilenler 
        elif user_role in [UserRole.KOMITE_LIDERI.value, UserRole.INSAN_KAYNAKLARI.value]: 
            query = query.or_(f"privacy.in.(genel,gizli),sender_id.eq.{current_user_id}")
            
        else:
            # Diğer herkes (Güvenlik önlemi)
            query = query.or_(f"privacy.eq.genel,sender_id.eq.{current_user_id}")
     
        if search_name:
            # Virgülleri temizleyelim, Supabase'in "or_" ayıracını bozmasın
            clean_search = search_name.replace(",", "")
            
            # Arama metninin varyasyonlarını çıkartıp 'Set' (benzersizler) içine alıyoruz
            variants = {
                clean_search,
                clean_search.lower(),
                clean_search.upper(),
                clean_search.replace("I", "ı").replace("İ", "i").lower(),
                clean_search.replace("ı", "I").replace("i", "İ").upper(),
                clean_search.capitalize()
            }
            
            # Elde ettiğimiz varyasyonları '.ilike' formatına hazırlıyoruz
            conditions = [f"report_name.ilike.%{v}%" for v in variants]
            
            # Hepsini OR ile veritabanına gönderiyoruz
            query = query.or_(",".join(conditions))
            
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
        admin_roles = [UserRole.ELCI.value, UserRole.GENEL_SEKRETER.value, UserRole.ADMIN.value, UserRole.ELCI_YARDIMCISI.value]
        
        is_owner = (report_owner_id == current_user_id)
        is_admin = (user_role in admin_roles)
        
        # Eğer ne sahibi ne de bir yönetici değilse ENGELLE
        if not (is_owner or is_admin):
             return {
                 "success": False, 
                 "message": "Bu raporu silme yetkiniz yok. Sadece kendi raporlarınızı silebilirsiniz"
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
             
        updated_file_url = old_file_url  
        unique_filename = None
        new_file_uploaded = False
        
        # 2. ÖNCE YENİ DOSYAYI YÜKLE (GÜVENLİ İŞLEM)
        if new_file_bytes and new_filename:
            safe_filename = new_filename.replace(" ", "_").replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c").replace("İ", "I").replace("Ğ", "G").replace("Ü", "U").replace("Ş", "S").replace("Ö", "O").replace("Ç", "C")
            unique_filename = f"{uuid.uuid4()}_{safe_filename}"
            
            # Yükleme (Eğer yükleme başarısız olursa exception fırlatır, alt satırlara geçmeden catch bloğuna düşer)
            supabase.storage.from_("reports").upload(
                file=new_file_bytes,
                path=unique_filename,
                file_options={"content-type": new_content_type}
            )
            updated_file_url = supabase.storage.from_("reports").get_public_url(unique_filename)
            new_file_uploaded = True
        # 3. YÜKLEME BAŞARILIYSA VERİTABANINI GÜNCELLE
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
             # 4. VERİTABANI GÜNCELLEMESİ DE BAŞARILIYSA ARTIK ESKİ DOSYAYI GÖNÜL RAHATLIĞIYLA SİLEBİLİRİZ
             if new_file_uploaded and old_file_url:
                 old_filename = old_file_url.split("/")[-1] 
                 try:
                     supabase.storage.from_("reports").remove([old_filename])
                 except Exception as e:
                     print(f"Uyarı: Eski dosya silinemedi: {str(e)}")
                     
             return {"success": True, "message": "Rapor başarıyla güncellendi ve tekrar onaya gönderildi.", "data": update_response.data[0]}
        else:
             # Veritabanı güncellemesi başarısız olduysa, sisteme boş yere yüklenen YENİ dosyayı geri sil/temizle
             if new_file_uploaded and unique_filename:
                 supabase.storage.from_("reports").remove([unique_filename])
                 
             return {"success": False, "message": "Veritabanı güncellemesi başarısız oldu."}
             
    except Exception as e:
        # Kodun herhangi bir yerinde (upload vs.) hata çıkarsa ve öksüz yeni dosya yüklendiyse, onu temizle
        if 'unique_filename' in locals() and unique_filename and 'new_file_uploaded' in locals() and new_file_uploaded:
            try:
                supabase.storage.from_("reports").remove([unique_filename])
            except:
                pass 
                
        return {"success": False, "message": f"Güncelleme işlemi sırasında bir hata oluştu: {str(e)}"}


# -------------------------
# RAPOR İNDİRME (GÜVENLİ İMZALI URL ALMA) SERVİSİ
# -------------------------
def get_report_download_url_service(report_id: int):
    try:
        # 1. Veritabanından raporu bul
        response = supabase.table("reports").select("file_url").eq("id", report_id).execute()
        
        if not response.data or not response.data[0].get("file_url"):
            raise Exception("Rapor dosyası bulunamadı.")
            
        file_url = response.data[0].get("file_url")
        
        if not file_url:
            return {"success": False, "message": "Bu rapora ait yüklü bir dosya bulunamadı."}
            
        # 2. Dosyanın adını URL'in sonundan çek (Örn: 123-abc_rapor.pdf)
        filename = file_url.split("/")[-1]
        
        # 3. SUPABASE PRIVATE BUCKET GÜVENLİĞİ: 
        # Public URL yerine sadece 60 saniye geçerli bir "Signed (İmzalı) URL" üretiyoruz.
        # Bu sayede kova (bucket) gizli bile olsa, backend izniyle dosya indirilebilir.
        signed_url_response = supabase.storage.from_("reports").create_signed_url(filename, 60)
        
        # Supabase Python kütüphanesi genelde sözlük (dict) içinde "signedURL" değerini döner
        secure_url = signed_url_response.get("signedURL")
        
        if not secure_url:
            raise Exception("Güvenli indirme linki oluşturulamadı.")
            
        return {"success": True, "url": secure_url}
        
    except Exception as e:
        raise Exception(f"İndirme linki alınırken hata: {str(e)}")