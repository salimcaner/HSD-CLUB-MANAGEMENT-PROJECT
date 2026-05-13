from app.core.supabase_client import get_supabase
from fastapi import HTTPException
from datetime import date


# -------------------------
# Etkinlikleri Aya Göre Getir
# -------------------------
def get_events_by_month_service(year: int, month: int):
    try:
        start_date = f"{year}-{month:02d}-01T00:00:00"

        if month == 12:
            end_date = f"{year + 1}-01-01T00:00:00"
        else:
            end_date = f"{year}-{month + 1:02d}-01T00:00:00"

        supabase = get_supabase()
        response = (
            supabase.table("events")
            .select("*")
            .gte("event_date", start_date)
            .lt("event_date", end_date)
            .order("event_date", desc=False)
            .execute()
        )

        return response.data
    except Exception as e:
        raise Exception(f"Takvim verileri getirilirken hata: {str(e)}")


# -------------------------
# Tüm Notları Getir
# -------------------------
def get_all_notes():
    """Tüm aktif takvim notlarını getirir (takvim grid için)."""
    supabase = get_supabase()
    response = (
        supabase.table("calendar_notes")
        .select("*")
        .order("tarih", desc=False)
        .execute()
    )
    return response.data or []


# -------------------------
# Tarihe Göre Notları Getir
# -------------------------
def get_notes_by_date(tarih: str):
    """Belirli bir tarihe ait notları getirir."""
    supabase = get_supabase()
    response = (
        supabase.table("calendar_notes")
        .select("*")
        .eq("tarih", tarih)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data or []


# -------------------------
# Not Ekle
# -------------------------
def create_note(data: dict, olusturan_id: str):
    supabase = get_supabase()

    # Tarih alanını string'e çevir
    if "tarih" in data and isinstance(data["tarih"], date):
        data["tarih"] = str(data["tarih"])

    data["olusturan_id"] = olusturan_id

    response = supabase.table("calendar_notes").insert(data).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=500, detail="Not eklenemedi!")


# -------------------------
# Not Güncelle
# -------------------------
def update_note(id: str, data: dict):
    supabase = get_supabase()

    # Tarih alanını string'e çevir
    if "tarih" in data and isinstance(data["tarih"], date):
        data["tarih"] = str(data["tarih"])

    # None olan alanları temizle
    data = {k: v for k, v in data.items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail="Güncellenecek alan bulunamadı!")

    response = supabase.table("calendar_notes").update(data).eq("id", id).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=404, detail="Not bulunamadı!")


# -------------------------
# Not Sil
# -------------------------
def delete_note(id: str):
    supabase = get_supabase()
    response = supabase.table("calendar_notes").delete().eq("id", id).execute()
    # Supabase silme işleminde data boş dönebilir, bu normal
    return {"message": "Not silindi!"}