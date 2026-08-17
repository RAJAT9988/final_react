from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.user_management.models.permission import Permission
from app.user_management.models.role import Role
from app.user_management.models.role_permission import RolePermission

ROLE_OWNER = 1
ROLE_ADMIN = 2
ROLE_OPERATOR = 3
ROLE_VIEWER = 4

ROLES: list[tuple[int, str]] = [
    (ROLE_OWNER, "owner"),
    (ROLE_ADMIN, "admin"),
    (ROLE_OPERATOR, "operator"),
    (ROLE_VIEWER, "viewer"),
]

PERMISSIONS: list[tuple[int, str, str, str, str]] = [
    (1, "view_device_overview", "Device", "view", "View device overview and health"),
    (
        2,
        "edit_device_settings",
        "Device",
        "edit",
        "Edit device name, location, timezone",
    ),
    (3, "restart_device", "Device", "restart", "Restart the device"),
    (4, "shutdown_device", "Device", "shutdown", "Shutdown the device"),
    (5, "factory_reset_device", "Device", "factory_reset", "Factory reset the device"),
    (
        6,
        "set_device_role",
        "Device",
        "set_role",
        "Set device role (standalone/master/slave)",
    ),
    (7, "add_user", "User", "add", "Add a new user"),
    (8, "edit_user", "User", "edit", "Edit an existing user"),
    (9, "remove_user", "User", "delete", "Remove a user"),
    (10, "assign_role", "User", "assign_role", "Assign or change a user's role"),
    (
        11,
        "reset_user_password",
        "User",
        "reset_password",
        "Reset another user's password",
    ),
    (12, "force_logout_user", "User", "force_logout", "Force logout a user"),
    (13, "enable_disable_user", "User", "enable_disable", "Enable or disable a user"),
    (14, "view_user_activity_log", "User", "view_activity", "View user activity log"),
    (15, "add_camera", "Camera", "add", "Add a new camera"),
    (16, "edit_camera", "Camera", "edit", "Edit camera configuration"),
    (17, "delete_camera", "Camera", "delete", "Delete a camera"),
    (18, "view_camera_list", "Camera", "view", "View camera list and status"),
    (
        19,
        "view_live_camera",
        "Camera",
        "live_view",
        "View live camera feed / AI overlay",
    ),
    (20, "restart_camera_stream", "Camera", "restart_stream", "Restart camera stream"),
    (
        21,
        "assign_model_to_camera",
        "Camera",
        "assign_model",
        "Assign AI model to camera",
    ),
    (22, "view_model_tabs", "AI Model", "view", "View AI model tabs and status"),
    (23, "configure_model", "AI Model", "configure", "Configure threshold, zones, FPS"),
    (24, "start_stop_inference", "AI Model", "start_stop", "Start or stop inference"),
    (
        25,
        "manage_face_database",
        "AI Model",
        "manage_faces",
        "Enroll faces / manage face database",
    ),
    (
        26,
        "upload_custom_model",
        "Custom Model",
        "upload",
        "Upload a custom model package",
    ),
    (
        27,
        "validate_test_model",
        "Custom Model",
        "validate",
        "Validate and test uploaded model",
    ),
    (
        28,
        "delete_custom_model",
        "Custom Model",
        "delete",
        "Delete or deactivate custom model",
    ),
    (29, "view_custom_models", "Custom Model", "view", "View custom models"),
    (
        30,
        "manage_alert_rule",
        "Alerts",
        "manage_rule",
        "Create, edit, delete alert rule",
    ),
    (31, "view_alerts", "Alerts", "view", "View alerts"),
    (32, "acknowledge_alert", "Alerts", "acknowledge", "Acknowledge an alert"),
    (
        33,
        "escalate_alert",
        "Alerts",
        "escalate",
        "Mark false positive / escalate alert",
    ),
    (
        34,
        "configure_notification_channel",
        "Alerts",
        "configure_channel",
        "Configure notification channels",
    ),
    (35, "view_reports", "Reports", "view", "View reports"),
    (
        36,
        "export_full_report",
        "Reports",
        "export_full",
        "Generate and export full report",
    ),
    (37, "export_limited_report", "Reports", "export_limited", "Export limited report"),
    (38, "schedule_report", "Reports", "schedule", "Schedule recurring reports"),
    (39, "view_system_logs", "Logs", "view_logs", "View system/camera/model logs"),
    (40, "view_audit_trail", "Logs", "view_audit", "View audit trail"),
    (41, "manage_slave_device", "Devices", "manage_slave", "Add/remove slave device"),
    (
        42,
        "view_device_consumption",
        "Devices",
        "view_consumption",
        "View device-wise consumption",
    ),
    (
        43,
        "reconnect_slave_device",
        "Devices",
        "reconnect_slave",
        "Reconnect/manage slave device",
    ),
    (44, "manage_network_settings", "Settings", "network", "Manage network settings"),
    (
        45,
        "manage_security_settings",
        "Settings",
        "security",
        "Manage security settings (2FA, tokens, IP whitelist)",
    ),
    (46, "manage_license", "Settings", "license", "Manage license"),
    (
        47,
        "manage_cloud_sync",
        "Settings",
        "cloud_sync",
        "Manage cloud sync / Atomic Centre account",
    ),
    (48, "manage_backup_restore", "Settings", "backup_restore", "Backup and restore"),
    (49, "manage_ota_update", "Settings", "ota", "Perform OTA update"),
    (50, "manage_billing", "Settings", "billing", "Manage billing"),
]

_ADMIN_DENIED = {4, 5, 6, 9, 45, 46, 47, 48, 49, 50}
_OPERATOR_ALLOWED = {1, 18, 19, 20, 22, 29, 31, 32, 33, 35, 37, 39, 42}
_VIEWER_ALLOWED = {1, 18, 19, 22, 29, 31, 35, 42}


def _is_allowed(role_id: int, permission_id: int) -> bool:
    if role_id == ROLE_OWNER:
        return True
    if role_id == ROLE_ADMIN:
        return permission_id not in _ADMIN_DENIED
    if role_id == ROLE_OPERATOR:
        return permission_id in _OPERATOR_ALLOWED
    if role_id == ROLE_VIEWER:
        return permission_id in _VIEWER_ALLOWED
    return False


async def seed_roles_and_permissions(db: AsyncSession) -> None:
    """Idempotently insert the 4 roles, 50 permissions, and 200 mappings."""
    existing = await db.execute(select(Role).limit(1))
    if existing.scalars().first() is not None:
        return

    for role_id, role_name in ROLES:
        db.add(Role(role_id=role_id, role_name=role_name, is_system_record=True))

    for permission_id, name, module, action, description in PERMISSIONS:
        db.add(
            Permission(
                permission_id=permission_id,
                name=name,
                module=module,
                action=action,
                description=description,
                is_system_record=True,
            )
        )

    mapping_id = 1
    for permission_id, _, _, _, _ in PERMISSIONS:
        for role_id, _role_name in ROLES:
            db.add(
                RolePermission(
                    id=mapping_id,
                    role_id=role_id,
                    permission_id=permission_id,
                    is_allowed=_is_allowed(role_id, permission_id),
                    is_system_record=True,
                )
            )
            mapping_id += 1

    await db.flush()
