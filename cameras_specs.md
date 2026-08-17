# Cameras Feature Specs

Cameras page: list cameras, discover on the network, connect, and add.

**Related:** app-shell + Home → [`home_specs.md`](home_specs.md)

Use this app’s Tailwind + `src/components/ui` (same as the setup wizard).

---

## Where it sits

```
App shell (Home | Cameras)
        ↓
Cameras (/app/cameras)   ← this module
```

- **URL:** `/app/cameras`
- **Must be logged in**
- Shell details: see `home_specs.md`

---

## Flow

```
Open /app/cameras
        ↓
Not logged in? → /setup/login
        ↓
Show adopted cameras + discover
        ↓
Click adopted camera row (or More)
        ↓
Right-side details drawer opens (full viewport height)
        ↓
Add Camera → fill form → Save → back to list
   or
Scan network → Connect (user/pass) → Add form → Save → list
```

---

## Files

| Role | Path |
|------|------|
| Route | `src/app/routes/app/cameras.tsx` |
| Page (orchestrator) | `src/features/cameras/components/cameras-page.tsx` |
| Adopted UI | `src/features/cameras/adopted/components/adopted-cameras.tsx` |
| Camera details drawer | `src/features/cameras/adopted/components/camera-details-drawer.tsx` |
| Live view page | `src/features/cameras/live/components/camera-live-page.tsx` |
| Live view route | `src/app/routes/app/camera-live.tsx` |
| Adopted API | `src/features/cameras/adopted/api/` (empty for now) |
| Live API | `src/features/cameras/live/api/` (empty for now) |
| Discover UI | `src/features/cameras/discover/components/discover-cameras.tsx` |
| Discover API | `src/features/cameras/discover/api/` (empty for now) |
| Connect UI | `src/features/cameras/connect/components/connect-camera-form.tsx` |
| Connect API | `src/features/cameras/connect/api/` (empty for now) |
| Add UI | `src/features/cameras/add/components/add-camera-form.tsx` |
| Add API | `src/features/cameras/add/api/` (empty for now) |
| URLs | `src/config/paths.ts` → `paths.app.cameras` |

---

## 1. Adopted cameras

List of cameras already added.

**Columns:** Name, Status, Manufacturer / Model, Room, Provider, Last seen

**Status:** Online / Connecting / Error (show error message if Error)

**Actions:** Open Camera, + Add Camera, row View / More

**Click row or More:** open the camera details drawer (see below).

**Open Camera / row View (eye):** go to live view page `/app/cameras/:cameraId` (see below).

---

## 1b. Camera details drawer (right sidebar)

Opens from the **right** when the user clicks an adopted camera row or the More (⋮) button.

| Item | Spec |
|------|------|
| Position | Full viewport height, flush top → bottom (no gap) |
| Render | Portal to `document.body` so page padding does not offset it |
| Backdrop | Dim overlay; click closes drawer |
| Close | X button, Escape key, or backdrop click |
| Header | Camera name + close |
| Tabs | Overview, Sources, Settings, Plugins |

**Overview tab**

- Preview area (timestamp + brand label)
- Overview list: Status, Sources count, Live streams, Manufacturer, Model
- Footer text: “No sensors available”

**Sources tab** (same idea as Add camera sources)

- Edit sources for this camera: name, role (`high` / `mid` / `low` / `snapshot`), URL
- Add / remove source, Test source
- Save sources (local for now; API later)
- Need at least one live stream (not only snapshot)

**Other tabs**

- Settings / Plugins — placeholders for now

---

## 1c. Camera live view (`/app/cameras/:cameraId`)

Opened by **Open Camera** (selected row) or the row **View** (eye) button.

| Area | Content |
|------|---------|
| Header | Back to cameras list; crumb “Live view & settings”; **camera name dropdown** to switch camera |
| Camera select | Dropdown lists adopted cameras; changing it navigates to `/app/cameras/:cameraId` |
| Player | LIVE badge, camera name, stream placeholder |
| Stream controls | WebRTC / MSE; High / Mid / Low |
| Toggles | Mute, Talk, PTZ, PiP, Zones |
| Actions | Snapshot, Share, Cast, Log (stub toasts for now) |
| Meta | Streaming mode + quality text |
| Events panel | Filter All / Motion / Person / Doorbell; event list for this camera |
| Status panel | Camera, State, Last motion, Codec |

---

## 2. Discover cameras

Scan the network for cameras.

- Button: Scan Network
- Show: scan progress %, found count, elapsed time, IP range
- Found list: Name, Manufacturer / Model, IP, Provider, Actions
- Actions: Connect, Hide / Unhide
- Toggle: Show hidden devices
- Empty: no cameras found

---

## 3. Connect camera

After picking a discovered device:

- Fields: Username, Password
- Cancel → back to list
- Continue → Add camera form
- Show connecting / error if needed

---

## 4. Add camera

From **+ Add Camera** or after Connect.

**Camera**

| Field | Notes |
|-------|--------|
| Name | Required |
| Type | Camera / Doorbell |
| Room | Pick or create a room |
| Branding (optional) | Manufacturer, Model, Hardware, Serial, Firmware, Support URL |

**Sources** (need at least one live stream)

- Name, role (high / mid / low / snapshot)
- URL (RTSP / ONVIF)
- Add / remove source, test source

**Summary**

- Show Type, Room, Brand, source count
- Checklist: name set, room set, live stream added
- Back → list; Save → list

---

## Navigation

| Event | Action |
|-------|--------|
| Not logged in | → `/setup/login` |
| Cancel / Back | → camera list |
| Save | → adopted list |
| Click adopted row / More | Open right details drawer |
| Close drawer | X, Escape, or backdrop |
| Open Camera / View | → `/app/cameras/:cameraId` live view |
| Live view Back | → `/app/cameras` |

---

## Rules

- Code in `src/features/cameras/`
- Do not import from `home`
- Thin routes only
- Use `paths.app.*.getHref()` — no hardcoded URLs
