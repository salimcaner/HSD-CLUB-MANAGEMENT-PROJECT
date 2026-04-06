from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, reports, events, projects, calendar, dashboard,social_media, community,finance
app = FastAPI(
    title="Kulüp Yönetim Sistemi API",
    description="Üniversite kulüplerini yönetmek için geliştirilen API.",
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True  # Token'ı hatırla (Swagger için)
    }
)

import os
from fastapi.staticfiles import StaticFiles

# CORS - Frontend ile konuşabilmek için deploya hazır ve localde çalışan yapı
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://localhost:5173", # Vite
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5500", # Live Server
    "null", # file:/// üzerinden erişimler için
]

# Canlı (Production) ortamından eklenecek origin'leri ENV üzerinden alır
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Artık true yapabiliyoruz çünkü spesifik originler belirttik
    allow_methods=["*"],
    allow_headers=["*"],     
)


# Auth router

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(reports.router)
app.include_router(events.router)
app.include_router(projects.router) 
app.include_router(calendar.router)
app.include_router(dashboard.router)
app.include_router(social_media.router)
app.include_router(community.router)
app.include_router(finance.router)


# Frontend klasörünü statik olarak sun (http://127.0.0.1:8000/frontend/...)
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")

from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    # Siteye girildiğinde otomatik olarak landing page açılsın (önceki adımda index.html yaptığımız için adı değişti)
    return RedirectResponse(url="/frontend/landing-page/index.html")


