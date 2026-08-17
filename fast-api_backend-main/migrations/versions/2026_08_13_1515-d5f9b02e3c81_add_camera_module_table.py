"""add camera module table

Revision ID: d5f9b02e3c81
Revises: c4e8a91d2b70
Create Date: 2026-08-13 15:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d5f9b02e3c81"
down_revision: Union[str, None] = "c4e8a91d2b70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cameras",
        sa.Column("camera_id", sa.UUID(), nullable=False),
        sa.Column("camera_name", sa.String(length=150), nullable=False),
        sa.Column("company_device_id", sa.UUID(), nullable=False),
        sa.Column("camera_type", sa.String(length=20), nullable=False),
        sa.Column("rtsp_url", sa.String(length=500), nullable=True),
        sa.Column("camera_status", sa.String(length=20), nullable=False),
        sa.Column("location", sa.String(length=150), nullable=True),
        sa.Column("zone", sa.String(length=100), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("camera_group", sa.String(length=100), nullable=True),
        sa.Column("resolution", sa.String(length=50), nullable=True),
        sa.Column("fps_limit", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), nullable=True),
        sa.Column("is_system_record", sa.Boolean(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["company_device_id"],
            ["company_devices.company_device_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("camera_id"),
    )
    op.create_index(
        op.f("ix_cameras_camera_id"), "cameras", ["camera_id"], unique=False
    )
    op.create_index(
        op.f("ix_cameras_camera_name"), "cameras", ["camera_name"], unique=False
    )
    op.create_index(
        op.f("ix_cameras_company_device_id"),
        "cameras",
        ["company_device_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_device_camera_assignments_camera_id_cameras",
        "device_camera_assignments",
        "cameras",
        ["camera_id"],
        ["camera_id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_device_camera_assignments_camera_id_cameras",
        "device_camera_assignments",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_cameras_company_device_id"), table_name="cameras")
    op.drop_index(op.f("ix_cameras_camera_name"), table_name="cameras")
    op.drop_index(op.f("ix_cameras_camera_id"), table_name="cameras")
    op.drop_table("cameras")
