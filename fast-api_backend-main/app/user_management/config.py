from app.core.configs.base_config import BaseConfig


class UserManagementConfig(BaseConfig):
    """JWT and password-reset settings for the user_management module."""

    JWT_SECRET_KEY: str = "change-me-in-development-use-32b+"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_2FA_CHALLENGE_EXPIRE_MINUTES: int = 5
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    TOTP_ISSUER: str = "Atomo"


user_management_config = UserManagementConfig()
