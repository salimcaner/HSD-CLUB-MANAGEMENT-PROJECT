from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth,users, reports
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
        "http://127.0.0.1:5500",  
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {"message": "Kulüp Yönetim Sistemi API'sine Hoşgeldiniz!"}



