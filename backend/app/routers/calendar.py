from fastapi import APIRouter, HTTPException, Query, Depends, status
from app.services.calendar_service import get_events_by_month_service
from app.core.security import get_current_user
from app.schemas.user import UserInDB

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get("/")
async def get_calendar_events(
    year: int = Query(..., ge=2020, le=2030, description="Yıl"),
    month: int = Query(..., ge=1, le=12, description="Ay"),
    current_user: UserInDB = Depends(get_current_user)
):
    try:
        events = get_events_by_month_service(year=year, month=month)
        
        return {
            "message": f"{year}-{month:02d} takvim verileri getirildi.",
            "total": len(events),
            "year": year,
            "month": month,
            "data": events
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=str(e)
        )