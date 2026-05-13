from app.core.supabase_client import get_supabase
from fastapi import HTTPException, status
from datetime import date

# -------------------------
# İşlemleri Listele
# -------------------------
def get_transactions(tur: str = None, kategori: str = None, baslangic: date = None, bitis: date = None):
    supabase = get_supabase()
    query = supabase.table("transactions").select("*")
    
    if tur:
        query = query.eq("tur", tur)
    if kategori:
        query = query.eq("kategori", kategori)
    if baslangic:
        query = query.gte("tarih", str(baslangic))
    if bitis:
        query = query.lte("tarih", str(bitis))
    
    response = query.order("tarih", desc=True).execute()
    return response.data or []

# -------------------------
# İşlem Ekle
# -------------------------
def create_transaction(data: dict, olusturan_id: str):
    supabase = get_supabase()
    data["olusturan_id"] = olusturan_id
    if "tarih" in data and isinstance(data["tarih"], date):
        data["tarih"] = str(data["tarih"])
    
    response = supabase.table("transactions").insert(data).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=500, detail="İşlem eklenemedi!")

# -------------------------
# İşlem Güncelle
# -------------------------
def update_transaction(id: str, data: dict):
    supabase = get_supabase()
    if "tarih" in data and isinstance(data["tarih"], date):
        data["tarih"] = str(data["tarih"])
    
    data = {k: v for k, v in data.items() if v is not None}
    response = supabase.table("transactions").update(data).eq("id", id).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=404, detail="İşlem bulunamadı!")

# -------------------------
# İşlem Sil
# -------------------------
def delete_transaction(id: str):
    supabase = get_supabase()
    supabase.table("transactions").delete().eq("id", id).execute()
    return {"message": "İşlem silindi!"}

# -------------------------
# Özet (Dashboard)
# -------------------------
def get_summary(baslangic: date = None, bitis: date = None):
    supabase = get_supabase()
    query = supabase.table("transactions").select("miktar, tur")
    
    if baslangic:
        query = query.gte("tarih", str(baslangic))
    if bitis:
        query = query.lte("tarih", str(bitis))
    
    response = query.execute()
    
    toplam_gelir = sum(r["miktar"] for r in response.data if r["tur"] == "gelir")
    toplam_gider = sum(r["miktar"] for r in response.data if r["tur"] == "gider")
    
    return {
        "toplam_gelir": toplam_gelir,
        "toplam_gider": toplam_gider,
        "net_bakiye": toplam_gelir - toplam_gider
    }

# -------------------------
# Düzenli Planları Listele
# -------------------------
def get_recurring():
    supabase = get_supabase()
    response = supabase.table("recurring_expenses").select("*").eq("aktif", True).execute()
    return response.data or []

# -------------------------
# Düzenli Plan Ekle
# -------------------------
def create_recurring(data: dict, olusturan_id: str):
    supabase = get_supabase()
    data["olusturan_id"] = olusturan_id
    data["aktif"] = True
    if "baslangic_tarihi" in data and isinstance(data["baslangic_tarihi"], date):
        data["baslangic_tarihi"] = str(data["baslangic_tarihi"])
    
    response = supabase.table("recurring_expenses").insert(data).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=500, detail="Düzenli plan eklenemedi!")

# -------------------------
# Düzenli Plan Güncelle
# -------------------------
def update_recurring(id: str, data: dict):
    supabase = get_supabase()

    # Tarih alanını string'e çevir
    if "baslangic_tarihi" in data and isinstance(data["baslangic_tarihi"], date):
        data["baslangic_tarihi"] = str(data["baslangic_tarihi"])

    # None olan alanları temizle (boş güncelleme yapılmasın)
    data = {k: v for k, v in data.items() if v is not None}

    if not data:
        raise HTTPException(status_code=400, detail="Güncellenecek alan bulunamadı!")

    response = supabase.table("recurring_expenses").update(data).eq("id", id).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=404, detail="Düzenli plan bulunamadı!")

# -------------------------
# Düzenli Plan Sil
# -------------------------
def delete_recurring(id: str):
    supabase = get_supabase()
    supabase.table("recurring_expenses").delete().eq("id", id).execute()
    return {"message": "Düzenli plan silindi!"}