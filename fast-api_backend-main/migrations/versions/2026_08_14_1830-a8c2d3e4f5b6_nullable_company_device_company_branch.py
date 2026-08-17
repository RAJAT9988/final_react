"""allow null company_id/branch_id on company_devices

Revision ID: a8c2d3e4f5b6
Revises: f7b3c4d5e6a1
Create Date: 2026-08-14 18:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a8c2d3e4f5b6"
down_revision: Union[str, None] = "f7b3c4d5e6a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "company_devices",
        "company_id",
        existing_type=sa.UUID(),
        nullable=True,
    )
    op.alter_column(
        "company_devices",
        "branch_id",
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "company_devices",
        "branch_id",
        existing_type=sa.UUID(),
        nullable=False,
    )
    op.alter_column(
        "company_devices",
        "company_id",
        existing_type=sa.UUID(),
        nullable=False,
    )
