# Device Module Specification

> Module: `app/device`
> Status: To be built
> Related: `AGENTS.md`, `specifications.md`, `company_module_specifications.md`,
> `camera_module_specifications.md`, `user_management_module_specifications.md`,

---

## 1. Overview

The `device` module owns the physical Atomo Processing Unit as a first-class
record (`Device`), its assignment to a `Company`/`company_branch`
(`company_device`), its runtime telemetry (`device_health`), which AI
detection models it has subscribed to (`device_model_subscription`), and
which cameras are actively running detection on it (`Device camera
assignment`). It follows the standard module convention from `AGENTS.md`:
routes → services → repositories → models, wired through
`dependencies/services.py` and `dependencies/repositories.py`.

**Reconciliation note against prior docs:** `specifications.md` §6 and the
earlier `Device Onboarding Specification` addendum list `License` and
`Device Link` as entities owned by `device`. The current ER diagram
(`ER-FINAL`) **no longer contains either table**. This spec treats them as
**dropped/deferred**, not silently carried forward — see §6 Open Questions.
Master/slave topology therefore currently has **no linking mechanism at
all** (not even the old no-FK `Device Link` placeholder) until that
question is resolved.

Entity relationships (from ER diagram):
- `Device` does **not** carry `company_id`/`branch_id` directly — ownership
  and location live entirely in `company_device`, a join/assignment table.
  This is deliberate: it makes reassignment (a device moved to a different
  company or branch) a new `company_device` row rather than a mutation of
  `Device` itself, preserving history.
- `company_device` belongs to one `Device`, one `Company`, and one
  `company_branch`. A `Device` can have more than one `company_device` row
  over its lifetime (reassignment history), but only one should be
  "current" at a time (see §2.4).
- `device_health` belongs to a `company_device` (not directly to `Device`),
  so telemetry is naturally scoped to a specific assignment period.
- `device_model_subscription` belongs to a `company_device` — which AI
  models (`person`, `face`, `fire_safety`) that assignment is licensed/
  enabled to run.
- `Device camera assignment` (`model_assign` table) belongs to a
  `company_device` and a `Camera` (owned by `camera` module, via
  `CameraGateway`) — it is the record of "this camera is actively running
  detection on this device", with its own confidence threshold and
  run status.
- `Report` (owned by the planned `report` module) and `Logs`/audit
  (owned by the planned `audit` module) both reference `company_device_id`
  — `device` does not own either table, only exposes the FK target.

**Enrollment/approval workflow (new in this revision):** a device does not
become an active `slave` the moment it's discovered — it first has to be
approved by an Owner/Admin. `company_device` now carries an
`approval_status` (`pending_approval` / `approved` / `rejected`) alongside
the existing assignment fields, so "is this device enrolled at this
branch yet" is tracked per-assignment, the same place `branch_id` already
lives. See §2.4 for the full rule and §2.5 for which permission gates the
approve/reject action.

**Two distinct registration paths (clarified in this revision):**
1. **Master/standalone registration** — an authenticated Owner action
   (`POST /devices`, existing flow). `company_id`/`branch_id` come from
   the acting user's context, not the request body.
2. **Slave self-registration request** — a *device*, not a user, calling
   an **unauthenticated** endpoint to ask to join an already-registered,
   already-approved `master` device (§2.4, §2.5, §3.1). The slave doesn't
   know a `company_id`/`branch_id` — it only knows the target master
   (by `serial_no`, see §2.4) — so the server derives company/branch
   context from that master's current `company_device` row. This is the
   only device endpoint with no permission check at all: the caller is
   hardware on the network, not a logged-in user.

No authentication is enforced on this module's endpoints in code yet — no
`CurrentUser`/`ActiveUser` dependency wired. Permission keys for device
actions are already defined in `user_management_module_specifications.md`
(§2.4.1, §2.4.9). The slave self-registration endpoint (§3.1) is the one
deliberate exception: it stays open even after auth is wired everywhere
else — see §2.5.

---

## 2. Functional Specifications

### 2.1 User Stories

- As an Owner, I can register a new physical device to my company and
  assign it to a branch.
- As an Owner or Admin, I can view a device's details, status, and role.
- As an Owner or Admin, I can rename a device or reassign it to a
  different branch after registration.
- As an Owner, I can set/change a device's deployment role
  (standalone/master/slave).
- As an Owner, I can deregister (soft-delete) a device.
- As any role, I can view the device list/status for my company
  (read-only for Operator/Viewer, per the permission matrix).
- As a **slave device on the network**, I can send an unauthenticated
  registration request — `{role: "slave", name, ip, dns_name, mac_id,
  serial_no}` plus the target master's identifying `serial_no` — to ask
  to join an already-registered, already-approved master device, and get
  temporarily registered as `pending_approval` under that master's
  company/branch.
- As an Owner or Admin, I can view the list of devices at a branch that
  are still `pending_approval`, including ones that arrived via slave
  self-registration.
- As an Owner or Admin, I can approve a pending device (self-registered
  or otherwise), which marks its `company_device.approval_status` as
  `approved` and flips `Device.status` to `Active` — after which it's a
  normal member of that company's device fleet, visible/manageable by
  that company's users per their role, same as any other device.
- As an Owner or Admin, I can reject a pending device instead, keeping it
  out of the active fleet without deleting its record.
- As the system, I can ingest periodic health telemetry (CPU/NPU/RAM/
  temperature) for a device and expose its latest status.
- As an Owner or Admin, I can enable/disable a specific AI model
  subscription (`person`/`face`/`fire`, `safety`) on a device.
- As an Owner or Admin, I can assign a camera to a device to start
  detection, set its confidence threshold, and pause/stop/resume it.
- As another module (e.g. `camera`, `event`, `report`, `ai_model`), I can
  look up device/assignment info through `DeviceGateway` without querying
  `device` tables directly.

### 2.2 Features

| Feature | Description |
|---|---|
| Device CRUD | Register, view, update, soft-delete a `Device` |
| Company/branch assignment | `company_device` — links a `Device` to a `Company` + `company_branch`, tracks who assigned it and when |
| Slave self-registration | Unauthenticated endpoint — a slave device requests to join an already-approved master (identified by `serial_no`); company/branch context is derived from that master, not supplied by the caller — see §2.4 |
| Enrollment approval | `company_device.approval_status` — new/discovered devices sit as `pending_approval` until an Owner/Admin approves (→ `Device.status = Active`) or rejects them — see §2.4 |
| Post-approval company access | Once approved, a device is scoped to that company/branch exactly like any other — visible/editable by that company's users per the standard permission matrix (§2.5), no special-casing for self-registered devices |
| Reassignment history | Reassigning a device creates a new `company_device` row rather than mutating an existing one — see §2.4 |
| Health telemetry | `device_health` — periodic CPU/NPU/RAM/temperature snapshots per assignment |
| Model subscriptions | `device_model_subscription` — enable/disable `person`/`face`/`fire_safety` detection per device, with an encrypted subscription key and validity window |
| Camera assignment | `Device camera assignment` (`model_assign`) — attach a `Camera` to a device's detection pipeline, with confidence threshold and `running`/`stopped`/`paused` status |
| List views | Paginated/sortable/filterable listing for devices via `ListParams` |
| Cross-module access | Other modules read device/assignment data via `DeviceGateway` + DTOs, never the ORM models directly |
| Domain events | Device lifecycle events available for other modules to react to (§4.5) |
| Soft delete | `is_deleted` / `is_system_record` flags on every table |

### 2.3 Data Model

| Entity | Key fields | Relationships |
|---|---|---|
| `Device` | device_id (PK, uuid), device_name, IP, **dns_name** (new), device_role (enum: `standalone`, `master`, `slave`), status (enum: `Active`, `Inactive`, `Maintenance`, `offline`), serial_no., MAC_ID, manufacturing_date, audit fields | Has many `company_device` (assignment history) |
| `company_device` | company_device_id (PK, uuid), device_id (FK), company_id (FK), branch_id (FK), assign_by (**nullable** — null for slave self-registration, see §2.4), **approval_status** (enum: `pending_approval`, `approved`, `rejected` — new), **approved_by** (new), **approved_at** (new), audit fields | Belongs to `Device`, `Company`, `company_branch`; has many `device_health`, `device_model_subscription`, `Device camera assignment` |
| `device_health` | device_health_id (PK, uuid), company_device_id (FK), cpu_usage, npu_usage, RAM, temperature, audit fields | Belongs to `company_device` |
| `device_model_subscription` | subscription_id (PK, uuid), company_device_id (FK), model_id (enum: `person`, `face`, `fire_safety`), subscription_key (encrypted), is_enabled, enabled_by, start_date, end_date, audit fields | Belongs to `company_device` |
| `Device camera assignment` (`model_assign`) | model_assign_id (PK, uuid), camera_id (FK → `camera.Camera`), company_device_id (FK), confidence_threshold, status (enum: `running`, `stopped`, `paused`), start_date, end_date, audit fields | Belongs to `company_device`; belongs to `Camera` (owned by `camera` module) |

> Audit fields follow the repo-wide convention: `created_at`, `created_by`,
> `updated_at`, `updated_by`, `is_system_record` (bool), `is_deleted`
> (bool) — from `BaseModel`/`SoftDeleteMixin`.
>
> All primary keys are `uuid.uuid4`, consistent with `company` (see
> `Antigravity.md` §5) and every other implemented/planned module.

### 2.4 Business Rules

- **A branch may have multiple master devices.** There is **no** 1:1 or
  uniqueness constraint between `company_branch` and `device_role =
  'master'` on `company_device`. Multiple devices at the same branch can
  each independently be `master` — e.g. one per building wing/floor. This
  is a deliberate decision for this spec (not left open): do **not** add a
  partial-unique index or service-level check limiting masters per branch.
- **`company_device` is the current-assignment record, not just history.**
  A `Device` may accumulate multiple `company_device` rows over its
  lifetime (reassigned to a different branch/company), but only the
  most recent, non-deleted row for a given `device_id` should be treated
  as "current" by services/Gateway reads. Reassignment = soft-delete the
  old `company_device` row, insert a new one (mirrors the pattern already
  used for `company_device` itself per the earlier onboarding spec) —
  never hard-update `branch_id`/`company_id` in place, to preserve an
  audit trail.
- `device_health`, `device_model_subscription`, and `Device camera
  assignment` all key off `company_device_id`, not `device_id` directly —
  so telemetry/subscriptions/assignments are naturally scoped to the
  assignment period they occurred in, not smeared across reassignments.
- `device_id` must come from the device's reported hardware identity
  (serial number / MAC), never accepted as arbitrary user input at
  registration — the primary anti-clone/anti-spoof control (carried
  forward from the device onboarding addendum).
- **Default role is `slave`.** Any device that registers/is discovered
  without an explicit role is created with `device_role = 'slave'`. A
  device only becomes `master` (or `standalone`) via an explicit,
  permissioned action (§2.5) — it is never the default.
- **Enrollment/approval workflow — slave self-registration.**
  A slave device does not know a `company_id`/`branch_id`. It knows only
  the network identity of the master it wants to join. The request body
  is exactly:
  ```json
  {
    "role": "slave",
    "name": "...",
    "ip": "...",
    "dns_name": "...",
    "mac_id": "...",
    "serial_no": "...",
    "master_serial_no": "..."
  }
  ```
  `role` is always `"slave"` for this endpoint (see §6 — master/standalone
  registration is a separate, authenticated flow and does not use this
  request shape). `master_serial_no` identifies the target master device
  — `serial_no` was chosen as the handshake key (not `device_id`, which
  the slave has no way of knowing, since it's server-generated) because
  it's already the anti-spoof identity field for every device.

  Server-side, on `POST /devices/register-slave`:
  1. Look up a `Device` with `serial_no = master_serial_no`,
     `device_role = 'master'`, `Device.status = 'Active'`. If none is
     found, or its current `company_device.approval_status != 'approved'`,
     reject the request (404/400 — do not leak *why* beyond "target
     master not available", to avoid fingerprinting other companies'
     device inventory through this open endpoint).
  2. Read that master's **current** `company_device` row to get
     `company_id`/`branch_id` — this is the only source of that context;
     the request body never supplies it.
  3. Reject if a non-deleted `Device` already exists with the same
     `serial_no` or `mac_id` (duplicate/replay registration attempt) —
     409 Conflict, don't silently create a second record or silently
     update the existing one.
  4. In one transaction: insert `Device` (`device_role = 'slave'`,
     `status = 'Inactive'`, the supplied `name`/`ip`/`dns_name`/`mac_id`/
     `serial_no`), then insert `company_device` (`company_id`/`branch_id`
     from step 2, `assign_by = NULL` — there is no acting user,
     `approval_status = 'pending_approval'`).
  5. Return a minimal response (e.g. a registration reference / the new
     `device_id` + `status: pending_approval`) — **not** the resolved
     `company_id`/`branch_id`/company name, since the caller is
     unauthenticated and that would leak tenant identity to whatever's on
     the network.

  This applies more generally too: **every device at a branch that has
  not yet been reviewed by an Owner/Admin shows as `pending_approval`**,
  regardless of whether that branch already has a master. Two outcomes,
  both performed by an **authenticated Owner/Admin of the company that
  owns the target master's branch** (never by the master device itself —
  the master is hardware, not an actor; "the master approves it" in
  product terms means "a user managing that master's branch approves
  it," see §6):
  - **Approve** (`POST /devices/{id}/approve`): `company_device
    .approval_status → 'approved'`, `approved_by`/`approved_at` set to
    the approving user, `Device.status → 'Active'`. `device_role` stays
    `slave`. From this point on the device is an ordinary member of that
    company's fleet — visible via `GET /devices`, `GET
    /branches/{branch_id}/devices`, etc., and manageable by that
    company's users exactly per the standard permission matrix (§2.5) —
    no separate "self-registered device" access path exists.
  - **Reject** (`POST /devices/{id}/reject`): `company_device
    .approval_status → 'rejected'`. The device record and its
    `company_device` row are **not** deleted — a rejected device stays
    visible/auditable, it's just excluded from active-fleet queries and
    cannot run camera assignments or model subscriptions (enforced at the
    service layer, not just the UI).
  - A device with `approval_status != 'approved'` must be blocked from
    having any `Device camera assignment` created, and from having any
    `device_model_subscription` set `is_enabled = true` — approval is a
    hard gate on those two features, not just a status label.
  - While `pending_approval`, a device is **not** returned by the default
    `GET /devices` / `GET /branches/{branch_id}/devices` listings — only
    by the dedicated `GET /branches/{branch_id}/devices/pending-approval`
    endpoint (both still authenticated/RBAC-gated; pending devices are
    not exposed to the open internet, only the *registration* endpoint
    is open).
- **Promoting a device to `master` does not require re-approval of other
  devices.** Setting one device's `device_role = 'master'` is independent
  of the approval workflow above — it doesn't retroactively change any
  other device's `approval_status`. It only matters going forward: any
  device discovered *after* a branch already has a master still enters as
  `pending_approval` the same way a device discovered before one did.

### 2.5 Permission Enforcement

Every write endpoint must be wired behind `RequirePermission(...)` (once
`user_management` exists) using the exact permission rows already defined
in `user_management_module_specifications.md` — **with one deliberate
exception**: `POST /devices/register-slave` stays unauthenticated
permanently, not just until `user_management` is wired, because the
caller is a physical device on the network, not a logged-in user. No
new permission keys are introduced by this revision — approve/reject
reuses the existing "Add / remove slave device" row (§2.4.9 of that
spec), on the basis that approving a pending device *is* the act of
adding it to the active slave fleet.

| Action | Route(s) | Permission (from `user_management` spec) | Owner | Admin | Operator | Viewer |
|---|---|---|:---:|:---:|:---:|:---:|
| **Slave self-registration request** | `POST /devices/register-slave` | **None — always open, unauthenticated, no permission check** | — | — | — | — |
| View device overview / health | `GET /devices`, `GET /devices/{id}`, `GET /devices/{id}/health/latest` | §2.4.1 "View device overview / health" | ✔ | ✔ | ✔ | ✔ |
| Edit device name / location | `PATCH /devices/{id}` (name only) | §2.4.1 "Edit device name / location / timezone" | ✔ | ✔ | ✘ | ✘ |
| Set device role (incl. promote to `master`) | `PATCH /devices/{id}` (role field) | §2.4.1 "Set device role (standalone/master/slave)" | ✔ | ✘ | ✘ | ✘ |
| Deregister device | `DELETE /devices/{id}` | §2.4.1 (Owner-level, no dedicated row — treat as Owner-only pending clarification) | ✔ | ✘ | ✘ | ✘ |
| **View pending-approval list** | `GET /branches/{branch_id}/devices/pending-approval` | §2.4.1 "View device overview / health" (read-only, same row) | ✔ | ✔ | ✔ | ✔ |
| **Approve pending device** | `POST /devices/{id}/approve` | §2.4.9 "Add / remove slave device" | ✔ | ✔ | ✘ | ✘ |
| **Reject pending device** | `POST /devices/{id}/reject` | §2.4.9 "Add / remove slave device" | ✔ | ✔ | ✘ | ✘ |
| Reassign device to another branch | `POST /devices/{id}/reassign` | §2.4.9 "Reconnect / manage slave" (closest existing row) | ✔ | ✔ | ✘ | ✘ |
| Enable/disable model subscription | `POST /devices/{id}/model-subscriptions`, `PATCH /model-subscriptions/{id}` | (no dedicated `device` row yet — closest is `ai_model` §2.4.4 "Start / stop inference") | ✔ | ✔ | ✘ | ✘ |
| Create/update camera assignment | `POST /devices/{id}/camera-assignments`, `PATCH /camera-assignments/{id}` | §2.4.3 "Assign AI model to camera" (closest existing row) | ✔ | ✔ | ✘ | ✘ |

> Rows marked "closest existing row" are a best-effort mapping onto the
> permission matrix as it stands today — they are not exact 1:1 matches
> and should be confirmed with whoever owns `user_management`'s matrix;
> flagged again in §6.
>
> Because `POST /devices/register-slave` has no auth, it must still be
> protected against abuse by other means — `ConfigurableRateLimiter`
> (`specifications.md` §4.4) per source IP at minimum. Not a permission
> concern, but a availability/security one — see §6.

---

## 3. Interfaces

### 3.1 REST API (`app/device/routes/v1/`)

| Method | Path | Description |
|---|---|---|
| GET | `/devices` | Paginated/sortable/filterable list of devices (current company scope) |
| POST | `/devices` | Register a new device (master/standalone — authenticated, Owner-only) |
| POST | `/devices/register-slave` | **Unauthenticated.** A slave device requests to join an already-approved master (by `master_serial_no`) — creates `Device` + `company_device` as `pending_approval` |
| GET | `/devices/{id}` | Get a single device (includes current `company_device` assignment) |
| PATCH | `/devices/{id}` | Update device name / role / status |
| DELETE | `/devices/{id}` | Soft-delete a device |
| GET | `/branches/{branch_id}/devices` | List devices currently assigned to a branch |
| GET | `/branches/{branch_id}/devices/pending-approval` | List devices at a branch with `approval_status = 'pending_approval'` |
| POST | `/devices/{id}/approve` | Approve a pending device — `approval_status → 'approved'`, `Device.status → 'Active'` |
| POST | `/devices/{id}/reject` | Reject a pending device — `approval_status → 'rejected'`, record kept |
| POST | `/devices/{id}/reassign` | Reassign a device to a different company/branch (soft-deletes old `company_device`, inserts new; new row starts `pending_approval` again) |
| POST | `/devices/{id}/health` | Ingest a health telemetry snapshot |
| GET | `/devices/{id}/health/latest` | Get the most recent health snapshot |
| GET | `/devices/{id}/model-subscriptions` | List a device's model subscriptions |
| POST | `/devices/{id}/model-subscriptions` | Create/enable a model subscription |
| PATCH | `/model-subscriptions/{id}` | Update/enable/disable a subscription |
| GET | `/devices/{id}/camera-assignments` | List cameras assigned to a device |
| POST | `/devices/{id}/camera-assignments` | Assign a camera to a device (via `CameraGateway` to validate the camera exists) |
| PATCH | `/camera-assignments/{id}` | Update confidence threshold / status (`running`/`stopped`/`paused`) |
| DELETE | `/camera-assignments/{id}` | Soft-delete an assignment |

### 3.2 DI Wiring (`app/device/dependencies/`)

| File | Exposes (indicative) |
|---|---|
| `dependencies/repositories.py` | `DeviceRepositoryDep`, `CompanyDeviceRepositoryDep`, `DeviceHealthRepositoryDep`, `DeviceModelSubscriptionRepositoryDep`, `DeviceCameraAssignmentRepositoryDep` |
| `dependencies/services.py` | `DeviceServiceDep`, `CompanyDeviceServiceDep`, `DeviceHealthServiceDep`, `DeviceModelSubscriptionServiceDep`, `DeviceCameraAssignmentServiceDep` |

### 3.3 Exposed Dependencies (`app/device/__init__.py`)

| Export | Type | Purpose |
|---|---|---|
| `DeviceGateway` | DI dependency (Gateway) | Only sanctioned way other modules read device/assignment data |
| `DeviceDTO` / `CompanyDeviceDTO` / `DeviceModelSubscriptionDTO` / `DeviceCameraAssignmentDTO` | Pydantic DTOs (`schemas/`) | Cross-module-safe representations |
| `router_v1` | APIRouter | Registered centrally in `app.core.routers` |

### 3.4 Gateway Interface (`gateway.py`)

```python
class DeviceGatewayInterface(ABC):
    async def get_device(self, device_id: UUID) -> DeviceDTO: ...
    async def get_device_list(self, params: ListParams) -> PaginatedResult[DeviceDTO]: ...
    async def get_devices_by_branch(self, branch_id: UUID) -> list[DeviceDTO]: ...
    async def get_devices_by_company(self, company_id: UUID) -> list[DeviceDTO]: ...
    async def get_company_device(self, company_device_id: UUID) -> CompanyDeviceDTO: ...
    async def get_current_company_device(self, device_id: UUID) -> CompanyDeviceDTO: ...
```

> `camera`, `event`, `ai_model`, and `report` all depend on this Gateway to
> resolve "which company/branch does this device belong to" and "is this
> `company_device_id` valid" without touching `device`'s tables directly.

### 3.5 Events (`events.py`)

| Event | Dispatched when | Payload (indicative) |
|---|---|---|
| `DeviceRegistered` | A device is created via `POST /devices` (authenticated master/standalone path) | `device_id`, `company_id`, `branch_id` |
| `SlaveDeviceRegistrationRequested` | A device is created via `POST /devices/register-slave` (unauthenticated path) | `device_id`, `company_device_id`, `master_device_id` |
| `DeviceApproved` | A pending device is approved | `device_id`, `company_device_id`, `approved_by` |
| `DeviceRejected` | A pending device is rejected | `device_id`, `company_device_id`, `rejected_by` |
| `DeviceReassigned` | A device's `company_device` is replaced | `device_id`, `old_branch_id`, `new_branch_id` |
| `DeviceStatusChanged` | `Device.status` transitions | `device_id`, `old_status`, `new_status` |
| `DeviceHealthReported` | A health snapshot is ingested | `device_id`, `company_device_id` |
| `DeviceModelSubscriptionEnabled` / `...Disabled` | A subscription is toggled | `subscription_id`, `company_device_id`, `model_id` |
| `DeviceCameraAssigned` | A camera assignment is created | `model_assign_id`, `camera_id`, `company_device_id` |
| `DeviceDeleted` | A device is soft-deleted | `device_id` |

> A `CompanyDeleted` listener (from `company`) should decide what happens
> to devices assigned to a deleted company — still open, see §6.

---

## 4. Non-Functional Requirements

- Deletes are soft (`is_deleted`), consistent with the rest of the schema
  — never hard-delete `Device`/`company_device`/`device_health`/
  `device_model_subscription`/`Device camera assignment` rows.
- `device_model_subscription.subscription_key` must be encrypted at rest
  and never logged or returned in plaintext in any API response.
- The full registration flow (device insert + `company_device` insert)
  should be one DB transaction — a partially-registered device is a
  broken state to avoid (carried forward from the onboarding addendum).
- Health ingestion (`POST /devices/{id}/health`) is expected to be
  high-frequency; consider the `queue` service for async writes rather
  than blocking the ingesting request on a synchronous DB write.
- Cross-module writes (e.g. validating a `camera_id` via `CameraGateway`
  when creating a `Device camera assignment`) follow the same
  cross-module-write precedent already flagged as an open pattern
  question in the device onboarding addendum for `CompanyGateway`.
- The `approval_status != 'approved'` gate (§2.4) must be enforced in
  `DeviceCameraAssignmentService`/`DeviceModelSubscriptionService`, not
  just checked at the route layer — so no other caller (including
  `DeviceGateway` consumers acting on stale data) can bypass it.
- `POST /devices/register-slave` is the one permanently-unauthenticated
  device endpoint (§2.5). Its response payload must be minimal (no
  company name, no branch details, no other devices at that branch) so
  it can't be used to enumerate tenant data from an anonymous caller.
  It must be rate-limited independently of authenticated endpoints, and
  every request (success or reject) should be logged (`audit`/`Logs`)
  since it's the module's only unauthenticated write surface.

---

## 5. Sample / Seed Data

Since no physical devices are registered yet, the following fixture rows
let the rest of the stack (health dashboards, camera assignment, model
subscriptions) be exercised end-to-end against **already-existing**
records in the target database:

| Entity | Value |
|---|---|
| `company_id` | `3c6eb1d8-c092-4e2f-ae4e-a1622e9cf86c` |
| `branch_id` | `d63d972c-ebd3-43e0-b0b9-c15f0dd1706f` |
| `user_id` (used as `created_by`/`assign_by`) | `186fab0a-e3d8-4903-b211-bc939d090b94` |

Four devices are seeded at the **same branch** — two `master`
(demonstrating the §2.4 multi-master rule) plus one already-`approved`
`slave` and one still sitting at `pending_approval` (demonstrating the
enrollment workflow):

| device_id | device_name | device_role | status | approval_status |
|---|---|---|---|---|
| `76c4d241-0301-4666-88b6-6885eaf586a1` | Main Entrance NVR-01 | master | Active | approved |
| `d8b2ffc2-35f6-457f-b9d2-38fa48b154d3` | Warehouse NVR-02 | master | Active | approved |
| `1b90dbaa-8a55-4eb4-96eb-a49ad76f44fe` | Loading Dock Unit-03 | slave | Maintenance | approved |
| `2a5e6f31-9c4a-4b7e-8f10-3d6c9a4e0b2d` | Yard Camera Unit-04 | slave | Inactive | **pending_approval** |

The fourth device (`Yard Camera Unit-04`) has a `company_device` row but
no `device_health`, `device_model_subscription`, or camera assignment yet
— consistent with §2.4's gate: a device isn't approved, so nothing can be
attached to it. Use it to test `GET
/branches/d63d972c-ebd3-43e0-b0b9-c15f0dd1706f/devices/pending-approval`
and `POST /devices/2a5e6f31-9c4a-4b7e-8f10-3d6c9a4e0b2d/approve`.

The other three each have a `company_device` assignment row, a
`device_health` snapshot, and one or two `device_model_subscription` rows.
Camera rows and their `Device camera assignment` links are seeded in
`camera_module_specifications.md` §5 against those same three devices.

The full runnable seed script (SQL, safe to re-run — uses fixed UUIDs so
re-running is idempotent with `ON CONFLICT DO NOTHING`) is
`seed_device_camera_sample_data.sql`, delivered alongside this spec.

---

## 6. Open Questions

- **Master–slave linkage** — with `Device Link` gone, there is currently
  *no* field anywhere connecting a `slave` device to its `master`. Same
  two resolution options as before apply if/when this is reinstated:
  (A) self-referencing `linked_device_id` on `Device`, or (B) a
  `device_topology` junction table. Needs a decision before master/slave
  role has any functional meaning beyond a label.
- **`device_model_subscription.model_id`** — named `model_id` but its enum
  values (`person`, `face`, `fire_safety`) look like model *categories*,
  not a foreign key into `ai_model.Models.model_id/name`. Confirm whether
  this should instead be a real FK to `Models`, which would let the
  catalog grow without an enum migration.
- **Cascade on `Company`/`company_branch` deletion** — what happens to a
  company's device fleet when the company (or a specific branch) is
  deleted: cascade soft-delete, block deletion, or leave the
  `company_device` row orphaned? Carried over unresolved from
  `company_module_specifications.md` §5.
- **`camera_name` uniqueness** — the ER diagram underlines/bolds
  `camera_name` similarly to a key field even though only `camera_id` is
  marked `PK`. Confirm whether `camera_name` needs a uniqueness
  constraint (e.g. scoped per `company_device`) — see
  `camera_module_specifications.md` §6.
- Whether `POST /devices` (plain CRUD, this spec) and the guided
  `POST /devices/register` wizard flow (from the earlier onboarding
  addendum) should both exist, or the wizard supersedes plain creation —
  unresolved, carried over.
- **`approval_status`/`approved_by`/`approved_at` are not on the ER
  diagram.** They were added in this revision to satisfy the enrollment
  workflow requirement (§2.4) and are the module's own addition, not
  something confirmed against the diagram/DB owner yet — flag before
  generating migrations.
- **No dedicated permission row for "approve/reject a pending device"** —
  §2.5 maps it onto the existing "Add / remove slave device" row
  (§2.4.9) as the closest fit. Confirm with whoever owns
  `user_management_module_specifications.md` whether that's acceptable
  or a new explicit permission (e.g. "Approve device enrollment") should
  be added there instead.
- **Rejected-device lifecycle** — a `rejected` device's `company_device`
  row is kept (not deleted) per §2.4. Is there a path back from
  `rejected` to `pending_approval` (e.g. re-submit for review), or is
  `rejected` terminal and the device must be re-discovered as a new
  `company_device` row instead? Not specified.
- **Does promoting a device to `master` need its own approval step?**
  Currently only the initial slave-enrollment goes through
  `pending_approval` (§2.4); setting `device_role = 'master'` via
  `PATCH /devices/{id}` is a direct, immediate change gated only by the
  "Set device role" permission (Owner-only). Confirm that's intended and
  master promotion doesn't need the same pending/approve cycle.
- **"Master device approves" — interpreted as a human action.** This
  revision assumes "the master device approves the slave" is product
  shorthand for "an Owner/Admin of the company that manages that master
  approves it," since a `Device` row has no way to independently act as
  an API caller/actor in this codebase (no device-side credentials or
  service identity exist yet). If the intent is literally the *master
  device* calling an approve endpoint autonomously (e.g. after some local
  handshake), that needs its own device-identity/auth mechanism — a
  different, currently unscoped, piece of work. Confirm which is meant.
- **`master_serial_no` as the handshake key.** The registration payload
  described in the requirement doesn't specify how a slave identifies
  *which* master it's requesting to join. This spec assumes the slave
  supplies the target master's `serial_no` (already the anti-spoof
  identity field) rather than `ip`/`dns_name`, since serial numbers are
  unique and IP/DNS can change. Confirm this is how the real device
  firmware identifies its target master.
- **Duplicate/retry behavior on `POST /devices/register-slave`.** §2.4
  rejects a second request with the same `serial_no`/`mac_id` as a 409.
  Should a slave be able to retry (e.g. it didn't get a response and
  resends) — and if so, should that be idempotent (return the existing
  `pending_approval` record) rather than a hard conflict? Currently
  specified as a hard conflict; confirm that's acceptable for real device
  retry behavior.
- **Multiple masters at one branch + self-registration (§2.4 multi-master
  rule).** If a slave targets Master A but the branch also has Master B,
  which master's `company_device` does the slave inherit context from —
  the one it explicitly targeted (as specified here), or does it matter
  which master it connects to at all since they resolve to the same
  branch? Assumed the former (explicit target only) since a slave can
  only address one master in its request.