"""add devices.dns_name

Revision ID: f7b3c4d5e6a1
Revises: d5f9b02e3c81
Create Date: 2026-08-14 16:45:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f7b3c4d5e6a1"
down_revision: Union[str, None] = "d5f9b02e3c81"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "devices",
        sa.Column("dns_name", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("devices", "dns_name")
