from fastapi import HTTPException
from app.core.supabase_client import get_supabase
from datetime import datetime

supabase = get_supabase()


async def get_dashboard_stats():
    try:
        # 1. Toplam Üye Sayısı (Ayrım yapmadan herkesi sayar)
        members_response = supabase.table("profiles").select("id", count="exact").execute()
        total_members = members_response.count if members_response.count else 0
        
        # 2. Tüm Etkinlikleri Çek (Sahibi silinmiş olsa bile TÜMÜ çekilir)
        # Dikkat: profiles!inner(id) gibi bir JOIN kullanmadığımız için 
        # veritabanı sahibi olmayan etkinlikleri de listeye dahil eder.
        events_response = supabase.table("events").select("id, event_type").execute()
        events_data = events_response.data or []
        total_events = len(events_data)
        
        meeting_count = 0
        academy_count = 0
        
        # 3. Kategori Bazlı Sayım (Toplantı & Akademi)
        for event in events_data:
            # event_type verisini güvenli bir şekilde alıp küçük harfe çeviriyoruz
            e_type = str(event.get("event_type") or "").lower()
            
            if "toplantı" in e_type:
                meeting_count += 1
            elif "akademi" in e_type or "eğitim" in e_type:
                academy_count += 1
                
        # Frontend'in beklediği tüm verileri birleştirip dönüyoruz
        return {
            "total_members": total_members,
            "total_events": total_events,
            "meeting_count": meeting_count,
            "academy_count": academy_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard verileri çekilirken hata oluştu: {str(e)}")

async def get_committee_stats():
    try:
        # Tüm üyeleri çek
        response = supabase.table("profiles").select("role, department").execute()
        users = response.data or []
        
        # Sayaçları sıfırla
        counts = {
            'Yönetim Kurulu': 0,
            'Proje Komitesi': 0,
            'Pazarlama ve Sosyal Medya Komitesi': 0,
            'Sponsorluk ve Organizasyon Komitesi': 0,
            'Akademi Komitesi': 0,
            'Mezun': 0
        }
        
        for user in users:
            # None (Boş) gelebilecek değerlere karşı önlem
            role = str(user.get("role") or "").lower()
            dept = str(user.get("department") or "").lower()
            
            # 1. Yönetim Kurulu Kontrolü
            if role in ['admin', 'elci', 'genel_sekreter', 'komite_lideri', 'elci_yardimcisi']:
                counts['Yönetim Kurulu'] += 1
                
            # 2. Mezun Kontrolü
            elif role == 'mezun':
                counts['Mezun'] += 1
                
            # 3. Departmanlara (Komitelere) Göre Dağılım
            elif "proje" in dept:
                counts['Proje Komitesi'] += 1
            elif "eğitim" in dept or "akademi" in dept:
                counts['Akademi Komitesi'] += 1
            elif "organizasyon" in dept or "sponsorluk" in dept:
                counts['Sponsorluk ve Organizasyon Komitesi'] += 1
            elif any(keyword in dept for keyword in ["tasarım", "medya", "pr", "iletişim", "pazarlama"]):
                counts['Pazarlama ve Sosyal Medya Komitesi'] += 1
            else:
                
                counts['Proje Komitesi'] += 1
        # Sıralama Frontend'in tam beklediği gibi olmalı
        ordered_labels = [
            'Yönetim Kurulu', 
            'Proje Komitesi', 
            'Pazarlama ve Sosyal Medya Komitesi', 
            'Sponsorluk ve Organizasyon Komitesi', 
            'Akademi Komitesi', 
            'Mezun'
        ]
        
        ordered_counts = [counts[label] for label in ordered_labels]
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
        # Şu anki zamanı alıyoruz (ISO formatında)
        now = datetime.now().isoformat()
        
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
