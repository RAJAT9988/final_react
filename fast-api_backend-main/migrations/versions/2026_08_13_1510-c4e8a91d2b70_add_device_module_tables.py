"""add device module tables

Revision ID: c4e8a91d2b70
Revises: e32628739377
Create Date: 2026-08-13 15:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4e8a91d2b70"
down_revision: Union[str, None] = "e32628739377"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "devices",
        sa.Column("device_id", sa.UUID(), nullable=False),
        sa.Column("device_name", sa.String(length=150), nullable=False),
        sa.Column("ip", sa.String(length=64), nullable=False),
        sa.Column("device_role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("serial_no", sa.String(length=100), nullable=False),
        sa.Column("mac_id", sa.String(length=64), nullable=False),
        sa.Column("manufacturing_date", sa.Date(), nullable=True),
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
        sa.PrimaryKeyConstraint("device_id"),
    )
    op.create_index(
        op.f("ix_devices_device_id"), "devices", ["device_id"], unique=False
    )
    op.create_index(
        op.f("ix_devices_device_name"), "devices", ["device_name"], unique=False
    )
    op.create_index(op.f("ix_devices_serial_no"), "devices", ["serial_no"], unique=True)
    op.create_index(op.f("ix_devices_mac_id"), "devices", ["mac_id"], unique=True)

    op.create_table(
        "company_devices",
        sa.Column("company_device_id", sa.UUID(), nullable=False),
        sa.Column("device_id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("branch_id", sa.UUID(), nullable=False),
        sa.Column("assign_by", sa.UUID(), nullable=True),
        sa.Column("approval_status", sa.String(length=32), nullable=False),
        sa.Column("approved_by", sa.UUID(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
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
            ["device_id"], ["devices.device_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["company_id"], ["companies.company_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["branch_id"], ["company_branches.branch_id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("company_device_id"),
    )
    op.create_index(
        op.f("ix_company_devices_company_device_id"),
        "company_devices",
        ["company_device_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_company_devices_device_id"),
        "company_devices",
        ["device_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_company_devices_company_id"),
        "company_devices",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_company_devices_branch_id"),
        "company_devices",
        ["branch_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_company_devices_approval_status"),
        "company_devices",
        ["approval_status"],
        unique=False,
    )

    op.create_table(
        "device_health",
        sa.Column("device_health_id", sa.UUID(), nullable=False),
        sa.Column("company_device_id", sa.UUID(), nullable=False),
        sa.Column("cpu_usage", sa.Float(), nullable=False),
        sa.Column("npu_usage", sa.Float(), nullable=False),
        sa.Column("ram", sa.Float(), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=False),
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
        sa.PrimaryKeyConstraint("device_health_id"),
    )
    op.create_index(
        op.f("ix_device_health_device_health_id"),
        "device_health",
        ["device_health_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_device_health_company_device_id"),
        "device_health",
        ["company_device_id"],
        unique=False,
    )

    op.create_table(
        "device_model_subscriptions",
        sa.Column("subscription_id", sa.UUID(), nullable=False),
        sa.Column("company_device_id", sa.UUID(), nullable=False),
        sa.Column("model_id", sa.String(length=32), nullable=False),
        sa.Column("subscription_key", sa.String(length=255), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False),
        sa.Column("enabled_by", sa.UUID(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
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
        sa.PrimaryKeyConstraint("subscription_id"),
    )
    op.create_index(
        op.f("ix_device_model_subscriptions_subscription_id"),
        "device_model_subscriptions",
        ["subscription_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_device_model_subscriptions_company_device_id"),
        "device_model_subscriptions",
        ["company_device_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_device_model_subscriptions_model_id"),
        "device_model_subscriptions",
        ["model_id"],
        unique=False,
    )

    op.create_table(
        "device_camera_assignments",
        sa.Column("model_assign_id", sa.UUID(), nullable=False),
        sa.Column("camera_id", sa.UUID(), nullable=False),
        sa.Column("company_device_id", sa.UUID(), nullable=False),
        sa.Column("confidence_threshold", sa.Float(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
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
        sa.PrimaryKeyConstraint("model_assign_id"),
    )
    op.create_index(
        op.f("ix_device_camera_assignments_model_assign_id"),
        "device_camera_assignments",
        ["model_assign_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_device_camera_assignments_camera_id"),
        "device_camera_assignments",
        ["camera_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_device_camera_assignments_company_device_id"),
        "device_camera_assignments",
        ["company_device_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_device_camera_assignments_company_device_id"),
        table_name="device_camera_assignments",
    )
    op.drop_index(
        op.f("ix_device_camera_assignments_camera_id"),
        table_name="device_camera_assignments",
    )
    op.drop_index(
        op.f("ix_device_camera_assignments_model_assign_id"),
        table_name="device_camera_assignments",
    )
    op.drop_table("device_camera_assignments")
    op.drop_index(
        op.f("ix_device_model_subscriptions_model_id"),
        table_name="device_model_subscriptions",
    )
    op.drop_index(
        op.f("ix_device_model_subscriptions_company_device_id"),
        table_name="device_model_subscriptions",
    )
    op.drop_index(
        op.f("ix_device_model_subscriptions_subscription_id"),
        table_name="device_model_subscriptions",
    )
    op.drop_table("device_model_subscriptions")
    op.drop_index(
        op.f("ix_device_health_company_device_id"), table_name="device_health"
    )
    op.drop_index(op.f("ix_device_health_device_health_id"), table_name="device_health")
    op.drop_table("device_health")
    op.drop_index(
        op.f("ix_company_devices_approval_status"), table_name="company_devices"
    )
    op.drop_index(op.f("ix_company_devices_branch_id"), table_name="company_devices")
    op.drop_index(op.f("ix_company_devices_company_id"), table_name="company_devices")
    op.drop_index(op.f("ix_company_devices_device_id"), table_name="company_devices")
    op.drop_index(
        op.f("ix_company_devices_company_device_id"), table_name="company_devices"
    )
    op.drop_table("company_devices")
    op.drop_index(op.f("ix_devices_mac_id"), table_name="devices")
    op.drop_index(op.f("ix_devices_serial_no"), table_name="devices")
    op.drop_index(op.f("ix_devices_device_name"), table_name="devices")
    op.drop_index(op.f("ix_devices_device_id"), table_name="devices")
    op.drop_table("devices")
