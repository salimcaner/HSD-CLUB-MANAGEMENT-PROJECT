from fastapi import APIRouter, HTTPException, Query, Depends, status
from app.services.calendar_service import (
    get_events_by_month_service,
    get_all_notes,
    get_notes_by_date,
    create_note,
    update_note,
    delete_note
)
from app.schemas.calendar_note import NoteCreate, NoteUpdate
from app.core.security import get_current_user, require_lider_or_above
from app.schemas.user import UserInDB

router = APIRouter(prefix="/calendar", tags=["Calendar"])


# ==========================================
# ETKİNLİKLER
# ==========================================

@router.get("/")
async def get_calendar_events(
    year: int = Query(..., ge=2020, le=2030, description="Yıl"),
    month: int = Query(..., ge=1, le=12, description="Ay"),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        events = get_events_by_month_service(year=year, month=month)
        return {
            "message": f"{year}-{month:02d} takvim verileri getirildi.",
            "total": len(events),
            "year": year,
            "month": month,
            "data": events
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==========================================
# TAKVİM NOTLARI
# ==========================================

@router.get("/notes")
async def list_notes(
    tarih: str = Query(None, description="Tarihe göre filtrele (YYYY-MM-DD formatında)"),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Tüm takvim notlarını getirir.
    tarih parametresi verilirse sadece o güne ait notlar döner.
    """
    try:
        if tarih:
            notes = get_notes_by_date(tarih)
        else:
            notes = get_all_notes()
        return {
            "total": len(notes),
            "data": notes
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/notes", status_code=status.HTTP_201_CREATED)
async def add_note(
    request: NoteCreate,
    current_user: UserInDB = Depends(require_lider_or_above)
):
    """
    Yeni takvim notu ekler.
    Sadece lider ve üzeri yetkili kullanıcılar ekleyebilir.
    """
    try:
        return create_note(request.dict(), str(current_user.id))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/notes/{id}")
async def edit_note(
    id: str,
    request: NoteUpdate,
    current_user: UserInDB = Depends(require_lider_or_above)
):
    """
    Takvim notunu günceller.
    Sadece lider ve üzeri yetkili kullanıcılar güncelleyebilir.
    """
    try:
        return update_note(id, request.dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/notes/{id}")
async def remove_note(
    id: str,
    current_user: UserInDB = Depends(require_lider_or_above)
):
    """
    Takvim notunu siler.
    Sadece lider ve üzeri yetkili kullanıcılar silebilir.
    """
    try:
        return delete_note(id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )