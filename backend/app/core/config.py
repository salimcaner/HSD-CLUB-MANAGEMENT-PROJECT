import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Kulüp Yönetim Sistemi"
    PROJECT_VERSION: str = "1.0.0"
    
    #frontend
    FRONTEND_URL: str 
    
    # Security
    SECRET_KEY: str  
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    #supabase
    SUPABASE_URL: str 
    SUPABASE_SERVICE_KEY: str 

     # .env dosyasından okumasını istiyoruz
    model_config = SettingsConfigDict(env_file=".env")


   
settings = Settings()

