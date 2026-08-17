import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
import pyotp
from passlib.context import CryptContext

from app.user_management.config import user_management_config
from app.user_management.exceptions import (
    TwoFactorInvalidException,
    UnauthorizedException,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TYPE = "access"
CHALLENGE_TOKEN_TYPE = "2fa_challenge"


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt."""
    return str(pwd_context.hash(password))


def verify_password(password: str, password_hash: str) -> bool:
    """Return True if the plaintext password matches the stored hash."""
    return bool(pwd_context.verify(password, password_hash))


def hash_token(raw_token: str) -> str:
    """SHA-256 hash a refresh or reset token for at-rest storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_urlsafe_token() -> str:
    """Generate a high-entropy opaque token."""
    return secrets.token_urlsafe(48)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    user_id: uuid.UUID, company_id: uuid.UUID, role_name: str
) -> str:
    """Sign a short-lived access JWT."""
    expire = _utcnow() + timedelta(
        minutes=user_management_config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "company_id": str(company_id),
        "role_name": role_name,
        "type": ACCESS_TOKEN_TYPE,
        "exp": expire,
        "iat": _utcnow(),
    }
    return jwt.encode(
        payload,
        user_management_config.JWT_SECRET_KEY,
        algorithm=user_management_config.JWT_ALGORITHM,
    )


def create_2fa_challenge_token(user_id: uuid.UUID) -> str:
    """Sign a short-lived token that only completes a 2FA login."""
    expire = _utcnow() + timedelta(
        minutes=user_management_config.JWT_2FA_CHALLENGE_EXPIRE_MINUTES
    )
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": CHALLENGE_TOKEN_TYPE,
        "exp": expire,
        "iat": _utcnow(),
    }
    return jwt.encode(
        payload,
        user_management_config.JWT_SECRET_KEY,
        algorithm=user_management_config.JWT_ALGORITHM,
    )


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    """Decode and validate a JWT, ensuring the purpose claim matches."""
    try:
        payload = jwt.decode(
            token,
            user_management_config.JWT_SECRET_KEY,
            algorithms=[user_management_config.JWT_ALGORITHM],
        )
    except jwt.PyJWTError as exc:
        raise UnauthorizedException() from exc
    if payload.get("type") != expected_type:
        raise UnauthorizedException()
    return payload


def decode_access_token(token: str) -> dict[str, Any]:
    return decode_token(token, ACCESS_TOKEN_TYPE)


def decode_2fa_challenge_token(token: str) -> dict[str, Any]:
    return decode_token(token, CHALLENGE_TOKEN_TYPE)


def generate_totp_secret() -> str:
    return str(pyotp.random_base32())


def build_otpauth_uri(secret: str, email: str) -> str:
    totp = pyotp.TOTP(secret)
    return str(
        totp.provisioning_uri(
            name=email, issuer_name=user_management_config.TOTP_ISSUER
        )
    )


def verify_totp(secret: Optional[str], code: str) -> None:
    """Raise if the TOTP secret is missing or the code is wrong."""
    if not secret:
        raise TwoFactorInvalidException()
    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        raise TwoFactorInvalidException()


def refresh_token_expiry() -> datetime:
    return _utcnow() + timedelta(
        days=user_management_config.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )


def password_reset_expiry() -> datetime:
    return _utcnow() + timedelta(
        minutes=user_management_config.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
    )


def as_utc(value: datetime) -> datetime:
    """Normalize SQLite-naive datetimes to UTC for comparison."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value
