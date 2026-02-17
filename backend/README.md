# 🚀 BACKEND KURULUM REHBERİ

## 📦 KURULUM ADIMLARI

### 1️⃣ Projeyi Klonla

```bash
git clone https://github.com/salimcaner/HSD-CLUB-MANAGEMENT-PROJECT.git
cd HSD-CLUB-MANAGEMENT-PROJECT
```

---

### 2️⃣ Backend Branch'ine Geç

```bash
git checkout feature/backend
```

---

### 3️⃣ Backend Klasörüne Gir

```bash
cd backend
```

---

### 4️⃣ Python Kurulu mu Kontrol Et

```bash
python --version
```

**Eğer hata verirse:**
- Anaconda varsa: `C:\Users\KULLANICI_ADI\anaconda3\python.exe`
- Yoksa Python indir: https://www.python.org/downloads/

---

### 5️⃣ Virtual Environment Oluştur

**Anaconda ile:**
```bash
& "C:\Users\KULLANICI_ADI\anaconda3\python.exe" -m venv .venv
```

**Normal Python ile:**
```bash
python -m venv .venv
```

---

### 6️⃣ PowerShell Script İzni Ver (Bir kere)

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Soruya **Y** (Yes) de.

---

### 7️⃣ Virtual Environment'ı Aktif Et

```bash
.\.venv\Scripts\activate
```

Başarılı olursa terminal başında **`(.venv)`** yazacak.

---

### 8️⃣ Paketleri Yükle

```bash
pip install -r requirements.txt
```

Bu 2-3 dakika sürebilir, bekle.

---

### 9️⃣ .env Dosyası Oluştur (Opsiyonel)

`backend/` klasöründe `.env` dosyası oluştur:

```env
SECRET_KEY=supersecretkey_change_this_in_production
FRONTEND_URL=http://localhost:3000
```

---

### 🔟 Sunucuyu Başlat

```bash
uvicorn app.main:app --reload --port 8001
```

**Başarılı olursa:**
```
INFO: Uvicorn running on http://127.0.0.1:8001
```

---

### 1️⃣1️⃣ Tarayıcıda Test Et

**Ana sayfa:**
```
http://localhost:8001
```

**Swagger (API Dökümanları):**
```
http://localhost:8001/docs
```

---

## 🧪 TEST KULLANICILARI

Login testi için:

| Email | Şifre | Rol |
|-------|-------|-----|
| `admin@example.com` | `secret` | Admin |
| `elci@example.com` | `secret` | Elçi |
| `lider@example.com` | `secret` | Lider |
| `uye@example.com` | `secret` | Üye |
| `mezun@example.com` | `secret` | Mezun |

---

## 🔄 HER GÜN ÇALIŞMAYA BAŞLARKEN

```bash
cd backend
git pull origin feature/backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```

---

## ❌ SORUN ÇIKARSA

### Hata: `bcrypt` problemi
```bash
pip uninstall bcrypt
pip install bcrypt==4.0.1
```

### Hata: `email-validator` yok
```bash
pip install email-validator
```

### Hata: Port zaten kullanımda
```bash
uvicorn app.main:app --reload --port 8002
```

---

## 📁 PROJE YAPISI

```
backend/
├── app/
│   ├── core/          # Config, Security
│   ├── routers/       # API Endpoints
│   ├── schemas/       # Pydantic Models
│   ├── services/      # Business Logic
│   └── main.py        # Ana uygulama
├── .venv/             # Virtual Environment
├── requirements.txt   # Bağımlılıklar
└── .env               # Çevre değişkenleri (opsiyonel)
```

---

## 🎨 FRONTEND İLE ENTEGRASYON TESTİ

Backend'in frontend ile düzgün çalıştığını test etmek için:

### 🔧 ÖN HAZIRLIK (Bir Kere Yapılır)

**VS Code'a Live Server Extension Yükle:**
- VS Code → Extensions (Ctrl+Shift+X)
- **"Live Server"** ara (Ritwick Dey)
- Install

---

### 🚀 TEST ADIMLARI

#### 1. Backend Sunucusunu Başlat

```bash
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
```

Bu terminal **açık kalsın!**

---

#### 2. Frontend'i Live Server ile Aç

- VS Code'da `frontend/login-frontend/login.html` dosyasına sağ tıkla
- **"Open with Live Server"** seç
- Tarayıcı otomatik açılır: `http://127.0.0.1:5500`

---

#### 3. Console'u Aç ve Login Yap

- Tarayıcıda **F12** bas (Console açılır)
- Login bilgileri gir:
  - Email: `elci@example.com`
  - Şifre: `secret`
- **"Giriş Yap"** butonuna bas

---

#### 4. Sonuçları Kontrol Et

**✅ Başarılı İse:**

**Alert:**
```
Hoş geldiniz Ahmet Yılmaz!
```

**Console (F12):**
```javascript
✅ Giriş başarılı! {
  access_token: "eyJhbG...",
  user: { id: 2, email: "elci@example.com", ... }
}
```

**LocalStorage:**
- F12 → Application → Local Storage
- `access_token` ✅
- `user` ✅

---

**❌ Hata Varsa:**

Console'da göreceksin:
```
CORS hatası → Backend CORS ayarlarını kontrol et
401 Unauthorized → Email/şifre yanlış
Failed to fetch → Backend çalışmıyor mu kontrol et
```

---

### 🔄 Farklı Rollerle Test

| Email | Şifre | Rol |
|-------|-------|-----|
| `admin@example.com` | `secret` | Admin |
| `elci@example.com` | `secret` | Elçi |
| `lider@example.com` | `secret` | Lider |
| `uye@example.com` | `secret` | Üye |
| `mezun@example.com` | `secret` | Mezun |

---

### ✅ Başarılı Test Kriterleri

- [ ] Backend çalışıyor (http://localhost:8001)
- [ ] Frontend Live Server açıldı
- [ ] Login formu görünüyor
- [ ] Alert mesajı geliyor
- [ ] Console'da token var
- [ ] localStorage'da token kaydedildi
- [ ] Backend console: `POST /auth/login 200 OK`

---