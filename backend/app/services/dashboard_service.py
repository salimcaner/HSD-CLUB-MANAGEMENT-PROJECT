from fastapi import HTTPException
from app.core.supabase_client import get_supabase


supabase = get_supabase()


async def get_dashboard_stats():
    try:
        # 1. Toplam Üye Sayısını Çek (Aktif ayrımı yok, hepsi alınıyor)
        # profiles tablosundaki tüm kayıtların sadece id'sini çekip sayısını alıyoruz
        members_response = supabase.table("profiles").select("id", count="exact").execute()
        total_members = members_response.count if members_response.count else 0
        
        # 2. Toplam Etkinlik Sayısı (Topluluk Etkinliği)
        events_response = supabase.table("events").select("id, event_type").execute()
        events_data = events_response.data or []
        total_events = len(events_data)
        
        # 3. Toplantı ve Akademi Etkinliklerini Say
        meeting_count = 0
        academy_count = 0
        
        for event in events_data:
            # event_type bazında filtreleme yapıyoruz. 
            # Case-insensitive (Büyük/küçük harf duyarsız) olması için .lower() kullanıyoruz.
            e_type = event.get("event_type", "").lower()
            
            if "toplantı" in e_type:
                meeting_count += 1
            elif "akademi" in e_type or "eğitim" in e_type:
                academy_count += 1
        # Sonuçları Schemas formatında döndür
        return {
            "meeting_count": meeting_count,
            "academy_count": academy_count,
            "total_events": total_events,
            "total_members": total_members
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
        activities = []
        
        # 1. En Yeni Etkinlikleri Çek
        # Etkinliklerin oluşturulma tarihine göre azalan (desc) sırada son 10 tanesini alıyoruz
        events_response = supabase.table("events") \
            .select("id, title, created_at") \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
            
        events_data = events_response.data or []
        
        for ev in events_data:
            activities.append({
                "id": str(ev.get("id")),
                "type": "event",
                "title": "Yeni Etkinlik Oluşturuldu",
                "desc": f'"{ev.get("title", "İsimsiz")}" adlı etkinlik sisteme eklendi.',
                "created_at": ev.get("created_at"),
                "iconClass": "success"  # Yeşil nokta
            })
            
        # 2. En Yeni Üyeleri Çek
        # Üyelerin kayıt tarihine (created_at) göre en yeni 10 tanesini alıyoruz
        users_response = supabase.table("profiles") \
            .select("id, first_name, last_name, created_at") \
            .order("created_at", desc=True) \
            .limit(10) \
            .execute()
            
        users_data = users_response.data or []
        
        for user in users_data:
            first_name = user.get("first_name") or ""
            last_name = user.get("last_name") or ""
            full_name = f"{first_name} {last_name}".strip()
            
            if not full_name:
                full_name = "Yeni bir üye"
                
            activities.append({
                "id": str(user.get("id")),
                "type": "member",
                "title": "Yeni Üye Katıldı",
                "desc": f"{full_name} aramıza katıldı.",
                "created_at": user.get("created_at"),
                "iconClass": "info"  # Mavi nokta
            })
            
        # 3. Listeleri Birleştir ve Tarihe Göre Sırala (En Yeni En Üstte)
        # created_at datetime string olarak geliyor, ona göre ters (Reverse) sıralıyoruz
        sorted_activities = sorted(activities, key=lambda x: x["created_at"], reverse=True)
        
        # 4. Sadece İstenen Sayıda (Örn: 7) Döndür
        return {
            "activities": sorted_activities[:limit]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Son aktiviteler çekilirken hata oluştu: {str(e)}")