import uuid

import pytest
import pyotp

from app.user_management.exceptions import (
    TwoFactorInvalidException,
    UnauthorizedException,
)
from app.user_management.security import (
    ACCESS_TOKEN_TYPE,
    build_otpauth_uri,
    create_access_token,
    decode_2fa_challenge_token,
    decode_access_token,
    generate_totp_secret,
    hash_password,
    hash_token,
    verify_password,
    verify_totp,
)


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("Password123")
    assert hashed != "Password123"
    assert verify_password("Password123", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_access_token_roundtrip() -> None:
    user_id = uuid.uuid4()
    company_id = uuid.uuid4()
    token = create_access_token(user_id, company_id, "owner")
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["company_id"] == str(company_id)
    assert payload["role_name"] == "owner"
    assert payload["type"] == ACCESS_TOKEN_TYPE


def test_challenge_token_rejects_access_token() -> None:
    token = create_access_token(uuid.uuid4(), uuid.uuid4(), "owner")
    with pytest.raises(UnauthorizedException):
        decode_2fa_challenge_token(token)


def test_totp_verify() -> None:
    secret = generate_totp_secret()
    uri = build_otpauth_uri(secret, "owner@example.com")
    assert uri.startswith("otpauth://totp/")
    verify_totp(secret, pyotp.TOTP(secret).now())
    with pytest.raises(TwoFactorInvalidException):
        verify_totp(secret, "000000")


def test_token_hash_is_sha256() -> None:
    assert hash_token("abc") == hash_token("abc")
    assert hash_token("abc") != hash_token("abd")
    assert len(hash_token("abc")) == 64
