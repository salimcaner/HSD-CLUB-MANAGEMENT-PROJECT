from datetime import datetime
from pydantic import BaseModel
class DashboardStatsResponse(BaseModel):
    meeting_count: int      
    academy_count: int      
    total_events: int      
    total_members: int      


class CommitteeStatsResponse(BaseModel):
    labels: list[str]  
    counts: list[int]  


class ActivityItem(BaseModel):
    id: str                 # Aktivitenin ait olduğu id (Event id veya User id)
    type: str               # "event" veya "member"
    title: str              # Örn: "Yeni Etkinlik Oluşturuldu" veya "Yeni Üye Katıldı"
    desc: str               # Örn: "Yapay Zeka Zirvesi adlı etkinlik eklendi."
    created_at: datetime    # Sıralama yapmak için tarih
    iconClass: str          # Frontend'de css için "success" (yeşil) veya "info" (mavi)
class DashboardActivitiesResponse(BaseModel):
    activities: list[ActivityItem]