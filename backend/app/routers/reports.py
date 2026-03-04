from fastapi import APIRouter, HTTPException, Path, Query, UploadFile, File, Form, Depends, status
from typing import Optional
from app.services.report_service import create_report_service, get_all_reports_service, update_report_status_service, delete_report_service, update_report_service
from app.core.security import get_current_user
from app.core.security import require_lider_or_above
from app.schemas.report import ReportStatusUpdate
from app.schemas.user import UserInDB 

router = APIRouter(prefix="/reports", tags=["Reports"])
# ==========================================
# YENİ RAPOR OLUŞTURMA VE DOSYA YÜKLEME
# ==========================================
@router.post("/")
async def create_report_endpoint(
    file: UploadFile = File(...),
    report_name: str = Form(...),
    committee: str = Form(...),
    report_type: str = Form(...),
    privacy: str = Form(...),
    project_name: Optional[str] = Form(None), 
    current_user = Depends(get_current_user) 
):
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Desteklenmeyen dosya formatı. Lütfen PDF, DOC, JPG veya PNG yükleyin."
        )
    # DOSYA BOYUTU KONTROLÜ (RAM KORUMASI)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # Maksimum 5 MB limit
    file_bytes = await file.read()
    
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Dosya boyutu çok büyük. Maksimum 5 MB desteklenmektedir."
        )
    
    # Dosya servisine gönder
    created_report = create_report_service(
        sender_id=current_user.id,
        report_name=report_name,
        committee=committee,
        report_type=report_type,
        project_name=project_name,
        privacy=privacy,
        file_bytes=file_bytes,
        filename=file.filename,
        content_type=file.content_type
    )
    
    return {
        "message": "Rapor başarıyla oluşturuldu.",
        "data": created_report
    }


# ==========================================
# TÜM RAPORLARI LİSTELEME
# ==========================================
@router.get("/")
async def get_all_reports_endpoint(
    search_name: Optional[str] = Query(None, description="Rapor adında arama yap"),
    limit: int = Query(50, ge=1, le=100, description="Sayfada gösterilecek maksimum rapor sayısı"),
    offset: int = Query(0, ge=0, description="Atlanacak kayıt sayısı (Sayfalama için)"),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
        
        reports = get_all_reports_service(
            user_role=role_str,
            search_name=search_name,
            limit=limit,
            offset=offset
        )
        
        return {
            "message": "Raporlar listelendi.",
            "total": len(reports),
            "data": reports
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==========================================
# durum güncelleme (onay/reddetme)
# ==========================================
@router.patch("/{report_id}/status")
async def update_report_status_endpoint(
    status_data: ReportStatusUpdate,
    report_id: int = Path(..., title="Güncellenecek Rapor IDsi"),
    current_user = Depends(require_lider_or_above) 
):
   
    try:
         updated_report = update_report_status_service(
             report_id=report_id,
             new_status=status_data.status
         )
         
         if not updated_report:
             raise HTTPException(status_code=404, detail="Rapor bulunamadı veya güncellenemedi.")
             
         mesaj = "Rapor ONAYLANDI." if status_data.status == "Approved" else "Rapor REDDEDİLDİ."
         
         return {
             "message": mesaj,
             "data": updated_report
         }
         
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==========================================
# RAPOR SİLME
# ==========================================
@router.delete("/{report_id}")
async def delete_report_endpoint(
    report_id: int = Path(..., title="Silinecek Rapor IDsi"),
    current_user = Depends(get_current_user) 
):
    try:
        # EK BİLGİ: Kullanıcının rolünü al (String olarak)
        role_str = current_user.role if isinstance(current_user.role, str) else current_user.role.value
        
        result = delete_report_service(
            report_id=report_id, 
            current_user_id=str(current_user.id),
            user_role=role_str # <-- YENİ EKLENDİ
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

# ==========================================
# RAPOR GÜNCELLEME
# ==========================================
@router.put("/{report_id}")
async def update_report_endpoint(
    report_id: int = Path(...),
    report_name: str = Form(...),
    committee: str = Form(...),
    report_type: str = Form(...),
    privacy: str = Form(...),
    project_name: Optional[str] = Form(None),
    
    file: Optional[UploadFile] = File(None),
    
    current_user = Depends(get_current_user) 
):
    try:
        file_bytes = None
        file_name = None
        content_type = None
        
        if file and file.filename:
            allowed_types = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Desteklenmeyen dosya formatı. Lütfen PDF, DOC, JPG veya PNG yükleyin."
                )
                
            MAX_FILE_SIZE = 5 * 1024 * 1024
            file_bytes = await file.read()
            if len(file_bytes) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Dosya boyutu çok büyük. Maksimum 5 MB desteklenmektedir."
                )
            file_name = file.filename
            content_type = file.content_type
            
        result = update_report_service(
            report_id=report_id,
            current_user_id=str(current_user.id),
            new_report_name=report_name,
            new_committee=committee,
            new_report_type=report_type,
            new_privacy=privacy,
            new_project_name=project_name,
            new_file_bytes=file_bytes,
            new_filename=file_name,
            new_content_type=content_type
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