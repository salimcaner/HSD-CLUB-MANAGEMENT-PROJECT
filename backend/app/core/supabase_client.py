from supabase import create_client, Client
from app.core.config import settings

supabase: Client = create_client(
    settings.SUPABASE_URL.strip(),
    settings.SUPABASE_SERVICE_KEY.strip()
)