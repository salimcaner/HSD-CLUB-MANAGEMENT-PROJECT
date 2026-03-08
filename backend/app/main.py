from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, reports, events, projects,calendar 

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
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
 ],
    allow_credentials=True,
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


# Frontend klasörünü statik olarak sun (http://127.0.0.1:8000/frontend/...)
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
app.mount("/frontend", StaticFiles(directory=frontend_path), name="frontend")

@app.get("/")
async def root():
    return {"message": "Kulüp Yönetim Sistemi API'sine Hoşgeldiniz!"}


