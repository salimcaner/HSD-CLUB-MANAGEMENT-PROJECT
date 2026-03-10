from app.core.supabase_client import get_supabase

supabase = get_supabase()


def get_community_members_service():
    try:
        response = supabase.table("profiles").select(
            "id, first_name, last_name, role, department, class, university_department"
        ).execute()

        return response.data or []
    except Exception as e:
        raise Exception(f"Topluluk üyeleri getirilirken hata: {str(e)}")