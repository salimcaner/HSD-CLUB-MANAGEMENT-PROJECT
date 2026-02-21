from pydantic import BaseModel, EmailStr
from typing import Optional


# -------------------------
# LOGIN
# -------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# ADMIN → Invite User
# -------------------------
class InviteRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    department: Optional[str] = None
    class_: Optional[int] = None
    university_department: Optional[str] = None

