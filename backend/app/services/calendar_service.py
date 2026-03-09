from app.core.supabase_client import get_supabase

supabase = get_supabase()

def get_events_by_month_service(year: int, month: int):
    try:
        start_date = f"{year}-{month:02d}-01T00:00:00"
        
        if month == 12:
            end_date = f"{year + 1}-01-01T00:00:00"
        else:
            end_date = f"{year}-{month + 1:02d}-01T00:00:00"
        
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