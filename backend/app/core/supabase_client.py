from app.core.config import settings
from supabase import create_client, Client, ClientOptions

options = ClientOptions(headers={"x-supabase-role": "service_role"})
supabase: Client = create_client(settings.SUPABASE_URL,settings.SUPABASE_SERVICE_KEY, options=options)