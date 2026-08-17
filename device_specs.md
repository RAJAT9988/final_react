# Devices Feature Specs

Devices page: list adopted devices, discover on the network, and add.

**Same UX pattern as Cameras** → [`cameras_specs.md`](cameras_specs.md)  
**Related:** app-shell + Home → [`home_specs.md`](home_specs.md)

Use this app’s Tailwind + `src/components/ui` (same as the setup wizard).

---

## Where it sits

```
App shell (Home | Cameras | Devices)
        ↓
Devices (/app/devices)   ← this module
```

- **URL:** `/app/devices`
- **Must be logged in**
- Shell: add a **Devices** sidebar tab next to Home and Cameras (see below)

---

## App shell update

Sidebar links become three tabs: **Home**, **Cameras**, **Devices**.

| Role | Path |
|------|------|
| Layout | `src/features/app-shell/components/app-shell-layout.tsx` |
| Sidebar | `src/features/app-shell/components/app-sidebar.tsx` |
| URLs | `src/config/paths.ts` → `paths.app.devices` |

Do not import `home`, `cameras`, or `devices` into `app-shell`. Use `paths.app.*.getHref()` for links.

---

## Flow

```
Open /app/devices
        ↓
Not logged in? → /setup/login
        ↓
Show adopted devices + discover
        ↓
Click adopted device row (or More)
        ↓
Right-side details drawer opens (full viewport height)
        ↓
Add Device → fill form → Save → back to list
   or
Scan network → Add Device → Save → list
        ↓
Saved device appears under Adopted Devices
```

---

## Files

| Role | Path |
|------|------|
| Route | `src/app/routes/app/devices.tsx` |
| Page (orchestrator) | `src/features/devices/components/devices-page.tsx` |
| Adopted UI | `src/features/devices/adopted/components/adopted-devices.tsx` |
| Device details drawer | `src/features/devices/adopted/components/device-details-drawer.tsx` |
| Device detail page | `src/features/devices/detail/components/device-detail-page.tsx` |
| Device detail route | `src/app/routes/app/device-detail.tsx` |
| Adopted API | `src/features/devices/adopted/api/` |
| Detail API | `src/features/devices/detail/api/` |
| Discover UI | `src/features/devices/discover/components/discover-devices.tsx` |
| Discover API | `src/features/devices/discover/api/` |
| Add UI | `src/features/devices/add/components/add-device-form.tsx` |
| Add API | `src/features/devices/add/api/` |
| Dummy data | `src/testing/mocks/data/devices.json` |
| MSW handlers | `src/testing/mocks/handlers/devices.ts` |
| URLs | `src/config/paths.ts` → `paths.app.devices`, `paths.app.deviceDetail` |

---

## 1. Adopted devices

List of devices already added (same role as Adopted Cameras).

**Columns:** Device Name, Status, Role, IP, Serial No., MAC ID

**Status:** Active / Inactive / Maintenance / offline  
**Role:** standalone / master / slave

Device content shown to users follows the `Device` table: device_id, company_id, branch_id, device_name, IP, device_role, status, serial_no, MAC ID, manufacturing date, audit fields.

**Actions:** Open Device, + Add Device, row View / More

**Click row or More:** open the device details drawer (see below).

**Open Device / row View (eye):** go to device detail page `/app/devices/:deviceId` (see below).

After a successful Add → Save flow, the new device **must appear** in this Adopted Devices list.

---

## 1b. Device details drawer (right sidebar)

Opens from the **right** when the user clicks an adopted device row or the More (⋮) button.

Same behavior as the camera details drawer:

| Item | Spec |
|------|------|
| Position | Full viewport height, flush top → bottom (no gap) |
| Render | Portal to `document.body` so page padding does not offset it |
| Backdrop | Dim overlay; click closes drawer |
| Close | X button, Escape key, or backdrop click |
| Header | Device name + close |
| Tabs | Overview, Settings, Plugins |

**Overview tab**

- Identity: device name, IP, status, role
- Overview list: Device fields (IDs, IP, role, serial, MAC, manufacturing date, audit fields)

**Other tabs**

- Settings / Plugins — placeholders for now

---

## 1c. Device detail page (`/app/devices/:deviceId`)

Opened by **Open Device** (selected row) or the row **View** (eye) button (opens as dialog from the list; deep link route still supported).

**Not a stream view** — cameras show live video; devices show **analytics** only.

| Area | Content |
|------|---------|
| Header | Back / close; crumb “Device analytics”; **device name dropdown** to switch device |
| Identity | Device name, IP, role, status + stub actions (Refresh, Restart, Diagnose) |
| Metrics (`device_health`) | CPU usage, NPU usage, RAM, Temperature |
| Health record panel | device_health_id, created/updated audit fields, is_system_record, is_deleted |
| Device panel | Device fields (IDs, IP, role, serial, MAC, manufacturing date, audit) — no room/camera fields |

---

## 2. Discover devices

Scan the network for devices (device fields only — no room / camera columns).

- Button: Scan Network
- Show: scan progress %, found count, elapsed time, IP range
- Found list: Device Name, Role, IP, Serial No., MAC ID, Actions
- Actions: **Add Device**, **Hide / Unhide**
- Toggle: Show Hidden Devices
- Empty: No devices found

Discovered devices are not adopted until the user opens Add Device → Saves.
No username/password step for devices (unlike cameras).

---

## 3. Add device

From **+ Add Device** or discover **Add Device** — fields match `Device` content.
Discover prefills name, IP, role, serial, and MAC when available.

**Device**

| Field | Notes |
|-------|--------|
| Device name | Required |
| IP | Required |
| Device role | standalone / master / slave |
| Serial no. | Optional |
| MAC ID | Optional |
| Manufacturing date | Optional |

Company/branch/audit fields are filled by the backend (mocked for demo).

**Summary (right side)**

- Show name, IP, role, serial, MAC
- Checklist: name set, IP set
- Back → list; Save → adopted list (device appears under Adopted Devices)

---

## Fake APIs (demo / MSW)

Mirror cameras-style fake APIs; dummy data in `devices.json`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/devices` | Adopted devices list |
| `GET` | `/api/v1/devices/:deviceId` | One device (detail page) |
| `GET` | `/api/v1/devices/:deviceId/health` | Device health (`device_health`: cpu, npu, ram, temperature, audit fields) |
| `POST` | `/api/v1/devices` | Add / adopt device |
| `POST` | `/api/v1/devices/discover/scan` | Scan network → discovered devices |

API hooks live under each feature `api/` folder (same pattern as cameras).

---

## Navigation

| Event | Action |
|-------|--------|
| Not logged in | → `/setup/login` |
| Cancel / Back | → devices list |
| Save | → Adopted Devices list (new device visible) |
| Click adopted row / More | Open right details drawer |
| Close drawer | X, Escape, or backdrop |
| Open Device / View | → `/app/devices/:deviceId` detail page |
| Detail page Back | → `/app/devices` |

---

## Rules

- Code in `src/features/devices/`
- Do not import from `home` or `cameras` (no cross-feature imports)
- Thin routes only — no forms/API mapping in route files
- Use `paths.app.*.getHref()` — no hardcoded URLs
- Keep folder structure: `adopted/`, `discover/`, `add/`, `detail/`
- Devices are not cameras: no room/stream/username-password connect flow

---

## Out of scope (for later)

- Real network discovery / backend
- Real device streaming or sensor telemetry
- Home page device cards (unless added later in `home_specs.md`)
