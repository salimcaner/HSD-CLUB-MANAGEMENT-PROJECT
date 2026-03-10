from fastapi import APIRouter
from app.schemas.dashboard import DashboardStatsResponse, CommitteeStatsResponse, DashboardActivitiesResponse, CountdownResponse
from app.services.dashboard_service import get_dashboard_stats, get_committee_stats, get_recent_activities, get_upcoming_event_countdown


router = APIRouter( prefix="/dashboard",tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def fetch_dashboard_stats():
    """
    Anasayfa üst kısmındaki özet (metrik) kartlarının verilerini döner.
    """
    stats = await get_dashboard_stats()
    return stats


@router.get("/committees", response_model=CommitteeStatsResponse)
async def fetch_committee_stats():
    """
    Anasayfadaki 'Komite Dağılımı' pasta grafiğinin (Pie Chart) verilerini döner.
    """
    stats = await get_committee_stats()
    return stats


@router.get("/activities", response_model=DashboardActivitiesResponse)
async def fetch_recent_activities():
    """
    Anasayfa alt kısmındaki 'Son Aktiviteler' listesini (Etkinlik ve Üyeler) tarih sırasına göre döner.
    """
    # İhtiyacımız olan 7 tanesi
    result = await get_recent_activities(limit=7)
    return result


@router.get("/countdown", response_model=CountdownResponse)
async def fetch_countdown():
    """
    Anasayfadaki sayaç için en yakın gelecek etkinliğin bilgisini döner.
    """
    result = await get_upcoming_event_countdown()
    return result