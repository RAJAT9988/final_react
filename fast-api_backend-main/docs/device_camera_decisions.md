# Device + Camera Architectural Decisions Log

Recorded after implementing `app/device` and `app/camera` (plan defaults).

## Schema & identity

- **Table names**: plural, company style — `devices`, `company_devices`, `device_health`, `device_model_subscriptions`, `device_camera_assignments`, `cameras`. Seed SQL updated to match. `device_health` stays singular (telemetry snapshot table).
- **PKs/FKs**: UUID (`as_uuid=True`, `default=uuid.uuid4`) everywhere, including `assign_by` / `approved_by` / `enabled_by`.
- **`BaseModel.created_by` / `updated_by`**: left as `Integer` (core blast radius). Seed and runtime leave them null.
- **`device_id` at register**: server-generated `uuid4`. Anti-spoof is unique `serial_no` + unique `mac_id`.
- **`camera_name`**: no unique constraint (diagram inconsistency; revisit if product requires per-assignment uniqueness).
- **`model_id`**: string enum `person` / `face` / `fire_safety`, not an FK until `ai_model` exists.
- **Enums**: stored as `String` + service validation (same as `User.status`), not Postgres ENUM types.
- **Enrollment columns** on `company_devices`: `approval_status` (default `pending_approval`), `approved_by` (UUID null), `approved_at` (timestamptz null). Confirmed in scope.

## Auth & permissions

- HTTP routes require JWT (`RequirePermission` + seeded RBAC). Unauthenticated calls are 401/403.
- **Owner + Admin** (seeded matrix) may register/approve/reject devices (`manage_slave_device`), assign cameras, and manage cameras. Operator/Viewer are view-only for devices/cameras.
- `company_id` and `assign_by` are taken from the JWT actor, never from the client body. `DeviceCreate` / `DeviceReassign` only accept `branch_id` (must belong to `actor.company_id`).
- Cross-tenant reads/writes return **404** (not 403) via `app/device/tenancy.py`.
- **Owner-only** (matrix + service): `set_device_role` (`PATCH` with `device_role`) and `factory_reset_device` (`DELETE /devices/{id}`). Admin hitting those gets 403.

## Enrollment / approval

- `POST /devices` inserts `Device` (`slave`, `Inactive`) + `company_device` (`pending_approval`) in one DB session/transaction.
- Approve → `approved` + timestamps + `Device.status = Active`. Reject → `rejected` only; rows kept; device stays `Inactive`.
- Reassign → soft-delete current `company_device`, insert a new pending row, `Device.status = Inactive`. Cameras remain on the **old** `company_device_id` (historical).
- **Approval gate** (service layer, not route-only): cannot create a camera assignment, and cannot set `device_model_subscription.is_enabled = True`, unless current `company_device.approval_status == approved`. Creating a disabled subscription on a pending device is allowed.
- **Multi-master**: no unique index or service check. Two `master` devices on the same branch can both be approved.
- Master promotion is `PATCH /devices/{id}` role only — no second pending cycle.

## Enrollment / approval — slave self-registration

- `POST /devices/register-slave` is the only unauthenticated device write. No JWT / `RequirePermission`. All other device routes stay JWT-gated.
- Caller sends `role=slave`, `name`, `ip`, `dns_name`, `mac_id`, `serial_no`. No master lookup (no serial/dns/ip match). Inserts `Device` (`slave`, `Inactive`) + `company_device` (`pending_approval`, `assign_by` NULL, `company_id`/`branch_id` NULL).
- Duplicate live `serial_no` / `mac_id` → 409. Response body is only `{device_id, approval_status}`.
- Approval is still the existing authenticated `POST /devices/{id}/approve` (Owner/Admin), which stamps `company_id` from the actor when the assignment has none. No device-side identity.
- `devices.dns_name` is nullable. `company_devices.assign_by` was already nullable; no migration for that.
- Per-IP `ConfigurableRateLimiter` on this route only (in-memory stand-in; `fastapi-limiter` is not a dependency). structlog on success/reject; TODO to switch to audit/Log when that module exists.

## Cross-module boundaries

- Device validates company/branch via `CompanyGateway` (read-only).
- Camera validates `company_device_id` via `DeviceGateway.get_company_device` (existence only, not approval).
- Device camera assignment validates `camera_id` via `CameraGateway.get_camera`, injected at the **route** layer from `app.camera.gateway` (not `app.camera.__init__`) to avoid a gateway import cycle.
- Gateways never import the other module; services do not import another module’s repositories/models.
- Camera create does **not** auto-create a `Device camera assignment`.

## Secrets & telemetry

- `subscription_key` is stored as a string, **omitted from DTOs**, never logged. Encryption deferred until a crypto provider exists.
- `rtsp_url` is returned unmasked this build; never logged.
- Health ingest is **synchronous** (no queue yet).
- `camera_status` updates only via `PATCH /cameras/{id}/status`.

## Explicitly out of scope

- Device Link / License / wizard `POST /devices/register`.
- Master–slave linkage field (`linked_device_id` / `device_topology`).
- Company/branch delete cascade listeners.
- Rejected → pending retry path.
- Moving cameras automatically on device reassignment.
