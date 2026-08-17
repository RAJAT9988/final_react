import uuid
from typing import Optional


class UserManagementException(Exception):
    """Base exception for all user_management domain errors."""

    status_code: int = 400

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class UserNotFoundException(UserManagementException):
    """Raised when a requested user is not found."""

    status_code = 404

    def __init__(self, user_id: uuid.UUID) -> None:
        self.user_id = user_id
        super().__init__(f"User with ID {user_id} not found.")


class UserAlreadyExistsException(UserManagementException):
    """Raised when a user email is already registered."""

    status_code = 409

    def __init__(self, email: str) -> None:
        self.email = email
        super().__init__("A user with this email already exists.")


class InvalidCredentialsException(UserManagementException):
    """Raised when login credentials are invalid."""

    status_code = 401

    def __init__(self) -> None:
        super().__init__("Invalid email or password.")


class UnauthorizedException(UserManagementException):
    """Raised when a bearer or challenge token is invalid."""

    status_code = 401

    def __init__(self, message: str = "Invalid or expired token.") -> None:
        super().__init__(message)


class UserDisabledException(UserManagementException):
    """Raised when a disabled user attempts an authenticated action."""

    status_code = 403

    def __init__(self, user_id: Optional[uuid.UUID] = None) -> None:
        self.user_id = user_id
        super().__init__("User account is disabled.")


class TwoFactorInvalidException(UserManagementException):
    """Raised when a TOTP code is missing or incorrect."""

    status_code = 401

    def __init__(self) -> None:
        super().__init__("Invalid two-factor authentication code.")


class TwoFactorNotEnabledException(UserManagementException):
    """Raised when 2FA is required for an action but is not active."""

    status_code = 400

    def __init__(self) -> None:
        super().__init__("Two-factor authentication is not enabled.")


class TwoFactorAlreadyEnabledException(UserManagementException):
    """Raised when attempting to enable 2FA that is already active."""

    status_code = 400

    def __init__(self) -> None:
        super().__init__("Two-factor authentication is already enabled.")


class RefreshTokenInvalidException(UserManagementException):
    """Raised when a refresh token is missing, expired, or unknown."""

    status_code = 401

    def __init__(self) -> None:
        super().__init__("Invalid or expired refresh token.")


class RefreshTokenReuseDetectedException(UserManagementException):
    """Raised when a revoked refresh token is presented (possible theft)."""

    status_code = 401

    def __init__(self) -> None:
        super().__init__("Refresh token reuse detected.")


class PasswordResetInvalidException(UserManagementException):
    """Raised when a password reset token is invalid or expired."""

    status_code = 400

    def __init__(self) -> None:
        super().__init__("Invalid or expired password reset token.")


class RoleNotFoundException(UserManagementException):
    """Raised when a requested role is not found."""

    status_code = 404

    def __init__(self, role_id: int) -> None:
        self.role_id = role_id
        super().__init__(f"Role with ID {role_id} not found.")


class PermissionDeniedException(UserManagementException):
    """Raised when the caller lacks a required permission."""

    status_code = 403

    def __init__(self, permission_name: Optional[str] = None) -> None:
        self.permission_name = permission_name
        if permission_name:
            super().__init__(f"Permission denied: {permission_name}.")
        else:
            super().__init__("Permission denied.")


class InvalidRoleAssignmentException(UserManagementException):
    """Raised when an Admin attempts to assign Owner or Admin."""

    status_code = 403

    def __init__(self) -> None:
        super().__init__("Admins may only assign the Operator or Viewer roles.")


class CompanyHasUsersException(UserManagementException):
    """Raised when public registration is attempted on a non-empty company."""

    status_code = 403

    def __init__(self, company_id: uuid.UUID) -> None:
        self.company_id = company_id
        super().__init__(
            "This company already has users. Ask an Owner or Admin to add you."
        )


class CompanyNotAvailableException(UserManagementException):
    """Raised when the referenced company does not exist."""

    status_code = 404

    def __init__(self, company_id: uuid.UUID) -> None:
        self.company_id = company_id
        super().__init__(f"Company with ID {company_id} not found.")


class OwnerRoleRequiredException(UserManagementException):
    """Raised when a non-Owner attempts an Owner-only 2FA action."""

    status_code = 403

    def __init__(self) -> None:
        super().__init__("Only the Owner role may manage two-factor authentication.")
