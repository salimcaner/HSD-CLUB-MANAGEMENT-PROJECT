import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("app")

if not settings.SUPABASE_URL:
    logger.error("SUPABASE_URL is not set in environment variables.")
    raise RuntimeError("SUPABASE_URL is missing")
if not settings.SUPABASE_SERVICE_KEY:
    logger.error("SUPABASE_SERVICE_KEY is not set in environment variables.")
    raise RuntimeError("SUPABASE_SERVICE_KEY is missing")

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)