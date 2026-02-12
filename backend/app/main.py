from fastapi import FastAPI


app = FastAPI(
    title="Kulüp Yönetim Sistemi API",
    description="Üniversite kulüplerini yönetmek için geliştirilen API.",
    version="1.0.0"
)

# Router'ları (yönlendiricileri) buraya dahil edeceğiz.
from app.routers import auth
app.include_router(auth.router)

# Şimdilik bu bölümü yorum satırı olarak bırakıyoruz, çünkü router dosyaları henüz tam olarak hazır olmayabilir veya import edilmemiştir.
# İleride her bir modül (kullanıcılar, etkinlikler vb.) için router'ları buraya ekleyeceğiz.
# Örnek:
# from app.routers import users, events
# app.include_router(users.router)
# app.include_router(events.router)
@app.get("/")
async def root():

    return {"message": "Kulüp Yönetim Sistemi API'sine Hoşgeldiniz! Sistem aktif."}


