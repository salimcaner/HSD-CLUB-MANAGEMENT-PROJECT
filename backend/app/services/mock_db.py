from typing import Optional
from app.schemas.user import UserInDB
from app.core.security import get_password_hash

# Mock database
# Password for all mock users is "secret"
fake_users_db = {
    "admin@example.com": {
        "id": 1,
        "email": "admin@example.com",
        "full_name": "System Admin",
        "hashed_password": get_password_hash("secret"),
        "role": "admin",
        "is_active": True,
    },
    "leader@example.com": {
        "id": 2,
        "email": "leader@example.com",
        "full_name": "Committee Leader",
        "hashed_password": get_password_hash("secret"),
        "role": "committee_leader",
        "is_active": True,
    },
     "member@example.com": {
        "id": 3,
        "email": "member@example.com",
        "full_name": "Club Member",
        "hashed_password": get_password_hash("secret"),
        "role": "member",
        "is_active": True,
    },
}

def get_user(email: str) -> Optional[UserInDB]:
    if email in fake_users_db:
        user_dict = fake_users_db[email]
        return UserInDB(**user_dict)
    return None
