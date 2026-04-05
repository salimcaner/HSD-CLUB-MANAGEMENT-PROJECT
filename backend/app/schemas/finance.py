from pydantic import BaseModel
from typing import Optional
from datetime import date
import uuid

class TransactionCreate(BaseModel):
    baslik: str
    miktar: float
    tur: str  # 'gelir' veya 'gider'
    kategori: Optional[str] = None
    aciklama: Optional[str] = None
    tarih: date

class TransactionUpdate(BaseModel):
    baslik: Optional[str] = None
    miktar: Optional[float] = None
    tur: Optional[str] = None
    kategori: Optional[str] = None
    aciklama: Optional[str] = None
    tarih: Optional[date] = None

class RecurringCreate(BaseModel):
    baslik: str
    miktar: float
    kategori: Optional[str] = None
    aciklama: Optional[str] = None
    periyot: str  # 'haftalik', 'aylik', 'yillik'
    baslangic_tarihi: date