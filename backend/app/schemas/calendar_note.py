from pydantic import BaseModel
from typing import Optional
from datetime import date


class NoteCreate(BaseModel):
    baslik: str
    icerik: str
    tarih: date


class NoteUpdate(BaseModel):
    baslik: Optional[str] = None
    icerik: Optional[str] = None
    tarih: Optional[date] = None
