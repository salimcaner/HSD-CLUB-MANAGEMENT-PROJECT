from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router
from app.routers import auth
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Kulüp Yönetim Sistemi API'sine Hoşgeldiniz!"}