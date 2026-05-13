from fastapi import APIRouter, Depends
from typing import Optional
from datetime import date
from app.schemas.finance import TransactionCreate, TransactionUpdate, RecurringCreate, RecurringUpdate
from app.services.finance_service import (
    get_transactions,
    create_transaction,
    update_transaction,
    delete_transaction,
    get_summary,
    get_recurring,
    create_recurring,
    update_recurring,
    delete_recurring
)
from app.core import security

router = APIRouter(prefix="/api/finance", tags=["Finance"])

@router.get("/transactions")
async def list_transactions(
    tur: Optional[str] = None,
    kategori: Optional[str] = None,
    baslangic: Optional[date] = None,
    bitis: Optional[date] = None,
    current_user = Depends(security.require_authenticated)
):
    return get_transactions(tur, kategori, baslangic, bitis)

@router.post("/transactions")
async def add_transaction(
    request: TransactionCreate,
    current_user = Depends(security.require_yonetim)
):
    return create_transaction(request.dict(), str(current_user.id))

@router.put("/transactions/{id}")
async def edit_transaction(
    id: str,
    request: TransactionUpdate,
    current_user = Depends(security.require_yonetim)
):
    return update_transaction(id, request.dict())

@router.delete("/transactions/{id}")
async def remove_transaction(
    id: str,
    current_user = Depends(security.require_elci)
):
    return delete_transaction(id)

@router.get("/summary")
async def summary(
    baslangic: Optional[date] = None,
    bitis: Optional[date] = None,
    current_user = Depends(security.require_authenticated)
):
    return get_summary(baslangic, bitis)

@router.get("/recurring")
async def list_recurring(
    current_user = Depends(security.require_authenticated)
):
    return get_recurring()

@router.post("/recurring")
async def add_recurring(
    request: RecurringCreate,
    current_user = Depends(security.require_yonetim)
):
    return create_recurring(request.dict(), str(current_user.id))

@router.put("/recurring/{id}")
async def edit_recurring(
    id: str,
    request: RecurringUpdate,
    current_user = Depends(security.require_yonetim)
):
    return update_recurring(id, request.dict())

@router.delete("/recurring/{id}")
async def remove_recurring(
    id: str,
    current_user = Depends(security.require_yonetim)
):
    return delete_recurring(id)