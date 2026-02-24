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
    role: str  # Sadece email ve rol yeterli!


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str