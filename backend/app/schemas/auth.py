from pydantic import BaseModel, EmailStr

# Kullanıcı giriş isteği (Login Request) için veri doğrulama şeması.
# Pydantic kütüphanesini kullanarak gelen verinin formatını kontrol ediyoruz.
class LoginRequest(BaseModel):
    # Kullanıcının e-posta adresi.
    # EmailStr tipi ile geçerli bir e-posta formatı olup olmadığı otomatik kontrol edilir.
    email: EmailStr
    
    # Kullanıcının parolası.
    # String tipinde olmalıdır.
    password: str
