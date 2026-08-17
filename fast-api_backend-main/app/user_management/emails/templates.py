import logging
from pathlib import Path

logger = logging.getLogger(__name__)

VIEWS_DIR = Path(__file__).resolve().parent / "views"


def _load_view(name: str) -> str:
    return (VIEWS_DIR / name).read_text(encoding="utf-8")


def render_user_registration() -> str:
    return _load_view("user_registration.html")


def render_password_reset() -> str:
    return _load_view("password_reset.html")


def render_two_factor_enabled() -> str:
    return _load_view("two_factor_enabled.html")


def notify_user_registration() -> None:
    """Templates exist; mail core is not wired yet — do not log PII."""
    _ = render_user_registration()
    logger.info("Would send user_registration email")


def notify_password_reset() -> None:
    _ = render_password_reset()
    logger.info("Would send password_reset email")


def notify_two_factor_enabled() -> None:
    _ = render_two_factor_enabled()
    logger.info("Would send two_factor_enabled email")
