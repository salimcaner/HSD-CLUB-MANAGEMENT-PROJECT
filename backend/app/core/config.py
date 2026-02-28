import os
from dotenv import load_dotenv

# Load environment variables as early as possible
load_dotenv()

# Provide safe defaults to avoid None values
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SECRET_KEY = os.getenv("SECRET_KEY", "")


class Settings:
    PROJECT_NAME: str = "Kulüp Yönetim Sistemi"
    PROJECT_VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str = SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Supabase
    SUPABASE_URL: str = SUPABASE_URL
    SUPABASE_SERVICE_KEY: str = SUPABASE_SERVICE_KEY

   
settings = Settings()

