from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, users, reports, events, projects, calendar, dashboard,social_media, community
app = FastAPI(
    title="Kulüp Yönetim Sistemi API",
    description="Üniversite kulüplerini yönetmek için geliştirilen API.",
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True  # Token'ı hatırla (Swagger için)
    }
)

# CORS - Frontend ile konuşabilmek için GEREKLİ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Frontend'in çalıştığı her yere (file:/// vs) izin ver
    allow_credentials=False, # credentials=True ile '*' aynı anda kullanılmaz, bu yüzden False yapıyoruz
    allow_methods=["*"],
    allow_headers=["*"],     
)

import os
from fastapi.staticfiles import StaticFiles

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


# Frontend klasörünü statik olarak sun (http://127.0.0.1:8000/frontend/...)
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")

from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    # Siteye girildiğinde otomatik olarak landing page açılsın (önceki adımda index.html yaptığımız için adı değişti)
    return RedirectResponse(url="/frontend/landing-page/index.html")


