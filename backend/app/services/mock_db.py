from typing import Optional
from app.schemas.user import UserInDB
from app.core.security import get_password_hash

# Mock database
# Şifre: "secret" (tüm kullanıcılar için)
fake_users_db = {
    "admin@example.com": {
        "id": 1,
        "email": "admin@example.com",
        "full_name": "System Admin",
        "hashed_password": get_password_hash("secret"),
        "role": "admin",
        "is_active": True,
    },
    "elci@example.com": {
        "id": 2,
        "email": "elci@example.com",
        "full_name": "Ahmet Yılmaz",
        "hashed_password": get_password_hash("secret"),
        "role": "elci",
        "is_active": True,
    },
    "lider@example.com": {
        "id": 3,
        "email": "lider@example.com",
        "full_name": "Salim Caner",
        "hashed_password": get_password_hash("secret"),
        "role": "lider",
        "is_active": True,
    },
    "uye@example.com": {
        "id": 4,
        "email": "uye@example.com",
        "full_name": "Melike Yılmaz",
        "hashed_password": get_password_hash("secret"),
        "role": "uye",
        "is_active": True,
    },
    "mezun@example.com": {
        "id": 5,
        "email": "mezun@example.com",
        "full_name": "Can Çelik",
        "hashed_password": get_password_hash("secret"),
        "role": "mezun",
        "is_active": True,
    },
}

def get_user(email: str) -> Optional[UserInDB]:
    """Email ile kullanıcı getir"""
    if email in fake_users_db:
        user_dict = fake_users_db[email]
        return UserInDB(**user_dict)
    return None

def get_user_by_id(user_id: int) -> Optional[dict]:
    """ID ile kullanıcı getir"""
    for user_dict in fake_users_db.values():
        if user_dict["id"] == user_id:
            return user_dict
    return None