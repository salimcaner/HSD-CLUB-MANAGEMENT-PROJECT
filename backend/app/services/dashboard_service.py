from fastapi import HTTPException
from app.core.supabase_client import get_supabase
from datetime import datetime, timezone

supabase = get_supabase()


async def get_dashboard_stats():
    try:
        # 1. Toplam Üye Sayısı (count="exact" ile sadece sayı çekilir, satırlar gelmez)
        members_response = supabase.table("profiles").select("id", count="exact").execute()
        total_members = members_response.count if members_response.count else 0
        
        # 2. Etkinlik İstatistikleri (RPC ile veritabanında sayılır, Python'a sadece sonuç gelir)
        event_stats_response = supabase.rpc("get_dashboard_event_stats").execute()
        event_stats = event_stats_response.data or {}
                
        # Frontend'in beklediği tüm verileri birleştirip dönüyoruz
        return {
            "total_members": total_members,
            "total_events": event_stats.get("total_events", 0),
            "meeting_count": event_stats.get("meeting_count", 0),
            "academy_count": event_stats.get("academy_count", 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard verileri çekilirken hata oluştu: {str(e)}")

async def get_committee_stats():
    try:
        # RPC ile komite dağılımını veritabanında hesapla (Python'a sadece sonuç JSON gelir)
        response = supabase.rpc("get_committee_distribution").execute()
        dist = response.data or {}
        
        # Sıralama Frontend'in tam beklediği gibi olmalı
        ordered_labels = [
            'Yönetim Kurulu', 
            'Proje Komitesi', 
            'Pazarlama ve Sosyal Medya Komitesi', 
            'Sponsorluk ve Organizasyon Komitesi', 
            'Akademi Komitesi', 
            'Mezun'
        ]
        
        ordered_counts = [dist.get(label, 0) for label in ordered_labels]
        return {
            "labels": ordered_labels,
            "counts": ordered_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Komite istatistikleri çekilirken hata oluştu: {str(e)}")
    



async def get_recent_activities(limit: int = 7):
    try:
        # Yeni N+1 çözümümüz olan Supabase RPC fonksiyonunu çağırıyoruz
        # Bu fonksiyon events ve profiles tablolarını birleştirip sıralı olarak hazır formatta döner.
        response = supabase.rpc("get_dashboard_recent_activities").execute()
        
        # RPC'den dönen 'data' listesini alıyoruz
        activities = response.data or []
        
        # Frontend'in beklediği orjinal format: {'activities': [...]} yapısında döndürüyoruz
        # limit değerini ek bir güvenlik olarak uygulayabiliriz (zaten 7 dönmesi beklense bile)
        return {
            "activities": activities[:limit]
        }
    except Exception as e:
        import traceback
        print("!!! RPC ÇAĞRISINDA HATA MEYDANA GELDİ !!!")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Son aktiviteler çekilirken hata oluştu: {str(e)}")
    

# ==========================================
# GÜNCEL ETKİNLİK SAYACI (COUNTDOWN)
# ==========================================
async def get_upcoming_event_countdown():
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Etkinlik tarihi şu andan büyük (gelecekte) olan, 
        # tarihe göre en yakın (en küçük tarihli) 1 tanesini getir.
        response = supabase.table("events") \
            .select("title, event_date") \
            .gte("event_date", now) \
            .order("event_date", desc=False) \
            .limit(1) \
            .execute()
            
        if response.data:
            event = response.data[0]
            return {
                "success": True,
                "title": event.get("title"),
                "event_date": event.get("event_date")
            }
        else:
            return {
                "success": False,
                "message": "Yakın zamanda planlanmış bir etkinlik bulunamadı."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sayaç verisi çekilirken hata: {str(e)}")
