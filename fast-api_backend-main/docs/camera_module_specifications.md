# Camera Module Specification

> Module: `app/camera`
> Status: To be built
> Related: `AGENTS.md`, `specifications.md`, `device_module_specifications.md`,
> `company_module_specifications.md`, ER diagram (`ER-FINAL`)

---

## 1. Overview

The `camera` module owns the physical/logical `Camera` record — a video
source (RTSP/USB/MIPI) attached to a `Device` via its current
`company_device` assignment. It follows the standard module convention
from `AGENTS.md`: routes → services → repositories → models, wired through
`dependencies/services.py` and `dependencies/repositories.py`.

`camera` is intentionally a thin module: it does **not** own detection
config, confidence thresholds, or run state — that belongs to `Device
camera assignment` (`model_assign`), which lives in `device` (see
`device_module_specifications.md` §2.3) precisely so a camera's identity
is decoupled from "is it currently running detection, and with what
settings". A `Camera` can exist registered but unassigned.

Entity relationships (from ER diagram):
- `Camera` belongs to a `company_device` (`company_device_id` FK) — i.e.
  a camera is attached to a specific device *assignment* (company +
  branch + device), not to a bare `Device` or `Company` directly. If the
  device is reassigned (§2.4 of the device spec), the camera's ownership
  should be revisited — see §6.
- `Camera` is referenced by `Device camera assignment` (`device` module),
  `Event` (`event` module, planned), and `face_cluster` (`face_recognition`
  module, planned) — none of those are owned here; `camera` only exposes
  read access via `CameraGateway`.

No authentication is enforced on this module's endpoints in code yet — no
`CurrentUser`/`ActiveUser` dependency wired, consistent with
`specifications.md` §9. Permission keys for camera actions are already
defined in `user_management_module_specifications.md` §2.4.3
(`camera.add`/`camera.edit`/etc.); wire `RequirePermission(...)` once
`user_management` exists.

---

## 2. Functional Specifications

### 2.1 User Stories

- As an Owner or Admin, I can register a new camera and attach it to a
  device.
- As an Owner or Admin, I can edit a camera's name, location, zone,
  department, group, resolution, or FPS limit.
- As an Owner or Admin, I can view a camera's connection status
  (online/offline/disconnected).
- As an Owner or Admin, I can remove (soft-delete) a camera.
- As any role, I can view the camera list/status for my company
  (read-only for Operator/Viewer, per the permission matrix).
- As another module (e.g. `device`, `event`, `face_recognition`), I can
  look up camera info through `CameraGateway` without querying `camera`
  tables directly.

### 2.2 Features

| Feature | Description |
|---|---|
| Camera CRUD | Register, view, update, soft-delete a `Camera` |
| Device attachment | Every camera is linked to a `company_device` (via `CameraService` calling `DeviceGateway` to validate it exists) |
| Connection status | `camera_status` (`online`/`offline`/`disconnected`) surfaced for dashboards/health checks |
| Organizational metadata | `location`, `zone`, `department`, `camera_group` — free-text grouping fields for filtering/dashboards |
| Stream config | `camera_type` (`RTSP`/`USB`/`MIPI`), `rtsp_url/value`, `resolution`, `fps_limit` |
| List views | Paginated/sortable/filterable listing via `ListParams`, filterable by `company_device_id`, `zone`, `department`, `camera_group`, `camera_status` |
| Cross-module access | Other modules read camera data via `CameraGateway` + DTOs, never the ORM model directly |
| Soft delete | `is_deleted` / `is_system_record` flags |

### 2.3 Data Model

| Entity | Key fields | Relationships |
|---|---|---|
| `Camera` | camera_id (PK, uuid), camera_name, company_device_id (FK), camera_type (enum: `RTSP`, `USB`, `MIPI`), rtsp_url/value, camera_status (enum: `online`, `offline`, `disconnected`), location, zone, department, camera_group, resolution, fps_limit, audit fields | Belongs to `company_device` (owned by `device`); referenced by `Device camera assignment`, `Event`, `face_cluster` |

> Audit fields follow the repo-wide convention: `created_at`, `created_by`,
> `updated_at`, `updated_by`, `is_system_record` (bool), `is_deleted`
> (bool) — from `BaseModel`/`SoftDeleteMixin`.
>
> Primary key is `uuid.uuid4`, consistent with every other module.

### 2.4 Business Rules

- A `Camera` must reference a valid `company_device_id` at creation time
  — validated through `device.DeviceGateway`, not by joining `device`'s
  tables directly (cross-module boundary rule, per `AGENTS.md`).
- Registering a `Camera` does **not** automatically create a `Device
  camera assignment` — that's a separate, explicit action in `device`
  (`POST /devices/{id}/camera-assignments`). A camera can sit registered
  and unassigned/idle.
- `camera_status` reflects live connection state (set by whatever ingests
  the stream health signal — out of scope for this module's write path
  beyond exposing a `PATCH` to update it) and is independent of whether a
  `Device camera assignment` for it is currently `running`.

---

## 3. Interfaces

### 3.1 REST API (`app/camera/routes/v1/camera.py`)

| Method | Path | Description |
|---|---|---|
| GET | `/cameras` | Paginated/sortable/filterable list of cameras |
| POST | `/cameras` | Register a new camera (validates `company_device_id` via `DeviceGateway`) |
| GET | `/cameras/{id}` | Get a single camera |
| PATCH | `/cameras/{id}` | Update camera details |
| PATCH | `/cameras/{id}/status` | Update `camera_status` (online/offline/disconnected) |
| DELETE | `/cameras/{id}` | Soft-delete a camera |
| GET | `/devices/{company_device_id}/cameras` | List cameras attached to a device assignment |

### 3.2 DI Wiring (`app/camera/dependencies/`)

| File | Exposes (indicative) |
|---|---|
| `dependencies/repositories.py` | `CameraRepositoryDep` |
| `dependencies/services.py` | `CameraServiceDep` |

### 3.3 Exposed Dependencies (`app/camera/__init__.py`)

| Export | Type | Purpose |
|---|---|---|
| `CameraGateway` | DI dependency (Gateway) | Only sanctioned way other modules read camera data |
| `CameraDTO` | Pydantic DTO (`schemas/`) | Cross-module-safe representation |
| `router_v1` | APIRouter | Registered centrally in `app.core.routers` |

### 3.4 Gateway Interface (`gateway.py`)

```python
class CameraGatewayInterface(ABC):
    async def get_camera(self, camera_id: UUID) -> CameraDTO: ...
    async def get_camera_list(self, params: ListParams) -> PaginatedResult[CameraDTO]: ...
    async def get_cameras_by_company_device(self, company_device_id: UUID) -> list[CameraDTO]: ...
```

> `device` calls this when creating a `Device camera assignment` (to
> confirm the `camera_id` exists); `event` and `face_recognition` call it
> to resolve camera metadata for detections/face matches.

### 3.5 Events (`events.py`)

| Event | Dispatched when | Payload (indicative) |
|---|---|---|
| `CameraRegistered` | A camera is created | `camera_id`, `company_device_id` |
| `CameraStatusChanged` | `camera_status` transitions | `camera_id`, `old_status`, `new_status` |
| `CameraDeleted` | A camera is soft-deleted | `camera_id` |

---

## 4. Non-Functional Requirements

- Deletes are soft (`is_deleted`), consistent with the rest of the schema.
- Creating a `Camera` must not write to `device` tables directly — go
  through `DeviceGateway` to validate `company_device_id`, per the
  cross-module boundary rule in `AGENTS.md`.
- `rtsp_url/value` may contain credentials embedded in the URL — treat it
  like a secret: never log it, mask it in list responses if the caller
  lacks edit permission (exact masking rule TBD, see §6).

---

## 5. Sample / Seed Data

Cameras seeded against the three devices from
`device_module_specifications.md` §5 (same `company_id` / `branch_id`,
`created_by` = `186fab0a-e3d8-4903-b211-bc939d090b94`):

| camera_id | camera_name | company_device (device_name) | camera_type | camera_status |
|---|---|---|---|---|
| `9f867bdb-1abf-4e46-adeb-0e37af3f210f` | Main Entrance - Front Door | Main Entrance NVR-01 | RTSP | online |
| `049c64b7-bcba-4704-81ae-8ab04811bf22` | Main Entrance - Lobby | Main Entrance NVR-01 | RTSP | online |
| `66485553-dfee-464b-94e4-24b886f7e6e2` | Warehouse - Loading Bay 1 | Warehouse NVR-02 | RTSP | online |
| `6c4546d9-9856-4da2-acc3-b99eacdb3542` | Loading Dock - Gate Cam | Loading Dock Unit-03 | USB | disconnected |

Each is paired with a `Device camera assignment` row (owned by `device`)
so the assignment endpoints have something real to return. Full runnable
SQL (idempotent, fixed UUIDs) is in `seed_device_camera_sample_data.sql`,
delivered alongside this spec and `device_module_specifications.md`.

---

## 6. Open Questions

- **`camera_name` uniqueness** — the ER diagram styles `camera_name`
  (bold + underlined) similarly to a key field, even though only
  `camera_id` is marked `PK`. Confirm whether a uniqueness constraint is
  intended (e.g. unique per `company_device`), or whether the styling is
  just a diagram inconsistency.
- **Camera ownership on device reassignment** — if a device's
  `company_device` changes (§2.4 of the device spec), do its attached
  cameras move with it automatically, get orphaned, or require explicit
  re-attachment? Not specified on the ER diagram.
- **`rtsp_url/value` masking** — should read endpoints mask stream
  credentials for callers without edit permission, and if so, at what
  layer (schema-level field exclusion vs. service-level redaction)?
- Whether `camera_status` updates arrive via a dedicated ingest path
  (e.g. a lightweight heartbeat, mirroring `device_health`) rather than a
  manual `PATCH` — this spec assumes manual/API-driven updates only;
  confirm if an automated health-check mechanism is expected.