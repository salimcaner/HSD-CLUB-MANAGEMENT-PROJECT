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


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str