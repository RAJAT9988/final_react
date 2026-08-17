import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    company_id: uuid.UUID
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    mfa_required: bool = False
    challenge_token: Optional[str] = None


class Verify2FARequest(BaseModel):
    challenge_token: str
    code: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RestorePasswordRequest(BaseModel):
    email: EmailStr


class RestorePasswordResponse(BaseModel):
    """Issued until mail is wired — the raw token is returned so reset can succeed."""

    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class TwoFactorConfirmRequest(BaseModel):
    code: str


class TwoFactorDisableRequest(BaseModel):
    code: str


class TwoFactorEnableResponse(BaseModel):
    secret: str
    otpauth_uri: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
