import uuid
from fastapi import APIRouter, HTTPException, Path, Query, UploadFile, File, Form, Depends, status
from typing import Optional
from datetime import datetime
from PIL import Image 
import io             
from app.services.event_service import create_event_service, delete_event_service, get_all_events_service, get_event_by_id_service, update_event_service
from app.core.security import get_current_user
from app.schemas.user import UserInDB, UserRole

router = APIRouter(prefix="/events", tags=["Events"])

# ==========================================
# GÜVENLİK KONTROLÜ (ÜYE ENGELLEME)
# ==========================================
def require_create_event_permission(current_user: UserInDB = Depends(get_current_user)):
    role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
    
    # "uye" rolü engellenir
    if role_str == "uye" or role_str == UserRole.UYE.value:
         raise HTTPException(
             status_code=status.HTTP_403_FORBIDDEN,
             detail="Bu işlemi gerçekleştirmek için yetkiniz yok"
         )
    return current_user

# ==========================================
# SIKIŞTIRMALI ETKİNLİK OLUŞTURMA
# ==========================================
@router.post("/")
async def create_event_endpoint(
    title: str = Form(...),
    description: str = Form(...),
    event_date: datetime = Form(...),  
    location: str = Form(...),
    committee: str = Form(...),
    event_type: str = Form(...),                                 
    participant_count: Optional[int] = Form(None),                
    image: Optional[UploadFile] = File(None),                     
    current_user: UserInDB = Depends(require_create_event_permission) 
):
    try:
        optimized_file_bytes = None
        final_filename = None
        final_content_type = None
        default_image_url = None
        
        # 1. Dosya Yüklendiyse (Belki görevlinin elinde başta da resim vardır) Onu Sıkıştır/Al
        if image and image.filename:
            allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
            if image.content_type not in allowed_types:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sadece resim dosyası (JPG, PNG, WEBP) yükleyebilirsiniz.")
            file_bytes = await image.read()
            
            # Pillow ile Sıkıştırma
            try:
                img = Image.open(io.BytesIO(file_bytes))
                if img.mode in ("RGBA", "P"): img = img.convert("RGB")
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                output_buffer = io.BytesIO()
                img.save(output_buffer, format="WEBP", quality=75, method=6)
                
                optimized_file_bytes = output_buffer.getvalue()
                final_filename = f"evt_{uuid.uuid4().hex[:8]}.webp"
                final_content_type = "image/webp"
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Resim optimize edilirken hata oluştu: {str(e)}")
                
        
        else:
            optimized_file_bytes = None
            final_filename = None


        created_event = create_event_service(
            title=title,
            description=description,
            event_date=event_date.isoformat(), 
            location=location,
            committee=committee,
            event_type=event_type,                      
            participant_count=participant_count,        
            created_by=str(current_user.id),
            file_bytes=optimized_file_bytes, 
            filename=final_filename,         
            content_type=final_content_type,
            default_image_url=default_image_url         
        )
        
        return {
            "message": "Etkinlik başarıyla oluşturuldu!",
            "data": created_event
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# ==========================================
# GÜÇLENDİRİLMİŞ ETKİNLİK LİSTELEME
# ==========================================
@router.get("/")
async def get_all_events_endpoint(
    limit: int = Query(50, ge=1, le=100, description="Maksimum etkinlik sayısı"),
    offset: int = Query(0, ge=0, description="Atlanacak kayıt sayısı"),
    search_name: Optional[str] = Query(None, description="Etkinlik adında arama yap"),
    current_user: UserInDB = Depends(get_current_user) 
):
    try:
        events = get_all_events_service(
            limit=limit, 
            offset=offset,
            search_name=search_name
        )
        
        return {
            "message": "Etkinlikler başarıyla listelendi.",
            "total": len(events),
            "data": events
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
# ==========================================
# TEK BİR ETKİNLİĞİN İÇERİĞİNE GİRME
# ==========================================
@router.get("/{event_id}")
async def get_event_detail_endpoint(
    event_id: int = Path(..., title="Detaylarına bakılacak Etkinliğin ID'si"),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        event = get_event_by_id_service(event_id)
        
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aradığınız etkinlik bulunamadı.")
            
        return {
            "message": "Etkinlik detayı başarıyla getirildi.",
            "data": event
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



# ==========================================
# ETKİNLİK GÜNCELLEME (YAZILAR VE FOTOĞRAF)
# ==========================================
@router.put("/{event_id}")
async def update_event_endpoint(
    event_id: int = Path(..., title="Güncellenecek Etkinlik ID'si"),
    title: str = Form(...),
    description: str = Form(...),
    event_date: datetime = Form(...),
    location: str = Form(...),
    committee: str = Form(...),
    event_type: str = Form(...),                        # <-- EKLENDİ
    participant_count: Optional[int] = Form(None),      # <-- EKLENDİ (Frontend, etkinlik bitince girdirecek)
    image: Optional[UploadFile] = File(None),           # <-- Gerçek resim buradan gelecek (Eski default resmi ezecek)
    current_user: UserInDB = Depends(get_current_user) 
):
    try:
        optimized_file_bytes = None
        final_filename = None
        final_content_type = None
        
        if image and image.filename:
            allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
            if image.content_type not in allowed_types:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sadece resim dosyası (JPG, PNG, WEBP) yükleyebilirsiniz.")
                
            MAX_FILE_SIZE = 8 * 1024 * 1024
            file_bytes = await image.read()
            if len(file_bytes) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="Görsel boyutu maksimum 8 MB olabilir.")
                
            try:
                img = Image.open(io.BytesIO(file_bytes))
                if img.mode in ("RGBA", "P"): img = img.convert("RGB")
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                output_buffer = io.BytesIO()
                img.save(output_buffer, format="WEBP", quality=75, method=6)
                
                optimized_file_bytes = output_buffer.getvalue()
                final_filename = f"evt_{uuid.uuid4().hex[:8]}.webp"
                final_content_type = "image/webp"
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Resim optimize edilirken hata oluştu: {str(e)}")
                
        role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
        
        result = update_event_service(
            event_id=event_id,
            current_user_id=str(current_user.id),
            user_role=role_str,
            title=title,
            description=description,
            event_date=event_date.isoformat(),
            location=location,
            committee=committee,
            event_type=event_type,                  
            participant_count=participant_count,    
            new_file_bytes=optimized_file_bytes,
            new_filename=final_filename,
            new_content_type=final_content_type
        )
        
        if not result.get("success"):
            hata_mesaji = result.get("message", "")
            if "yetkiniz yok" in hata_mesaji.lower(): raise HTTPException(status_code=403, detail=hata_mesaji)
            elif "bulunamadı" in hata_mesaji.lower(): raise HTTPException(status_code=404, detail=hata_mesaji)
            else: raise HTTPException(status_code=400, detail=hata_mesaji)
                 
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ETKİNLİK SİLME
# ==========================================
@router.delete("/{event_id}")
async def delete_event_endpoint(
    event_id: int = Path(..., title="Silinecek Etkinliğin ID'si"),
    current_user: UserInDB = Depends(get_current_user) 
):
    try:
        role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
        
        result = delete_event_service(
            event_id=event_id, 
            current_user_id=str(current_user.id),
            user_role=role_str 
        )
       
        if not result.get("success"):
             hata_mesaji = result.get("message", "")
             if "yetkiniz yok" in hata_mesaji.lower():
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=hata_mesaji)
             elif "bulunamadı" in hata_mesaji.lower():
                  raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=hata_mesaji)
             else:
                  raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=hata_mesaji)
                  
        return result
            
    except HTTPException:
         raise
    except Exception as e:
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))