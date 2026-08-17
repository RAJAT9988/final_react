# Home Feature Specs

Home page after setup. Shared layout lives in `app-shell`.

**Related:** [`cameras_specs.md`](cameras_specs.md)

Use this app’s Tailwind + `src/components/ui` (same as the setup wizard).

---

## Where it sits

```
Setup wizard (7 steps)
        ↓
User Registration success
        ↓
App shell
        ↓
Home (/app/home)   ← this module
```

- **URL:** `/app/home`
- **Must be logged in**
- **After setup User success:** go here

---

## Flow

```
User finishes setup
        ↓
Go to /app/home
        ↓
Not logged in? → /setup/login
        ↓
Show sidebar (Home | Cameras) + Home content
```

---

## App shell (shared)

Sidebar with two links only: **Home**, **Cameras**. Main area shows the page.

| Role | Path |
|------|------|
| Layout | `src/features/app-shell/components/app-shell-layout.tsx` |
| Sidebar | `src/features/app-shell/components/app-sidebar.tsx` |
| Logo | `src/features/app-shell/components/atomo-logo.tsx` |
| Route shell | `src/app/routes/app/root.tsx` |

Do not import `home` or `cameras` into `app-shell`. Use `paths.app.*.getHref()` for links.

---

## Files

| Role | Path |
|------|------|
| Route | `src/app/routes/app/home.tsx` |
| Page | `src/features/home/components/home-page.tsx` |
| Recent Events | `src/features/home/components/recent-events.tsx` |
| Camera cards | `src/features/home/components/camera-feed-grid.tsx` |
| URLs | `src/config/paths.ts` → `paths.app.home` |

---

## Page content

### Recent Events

- Section title: Recent Events
- List of recent event cards
- If empty: show **No recent events**

### Cameras

- Section title: Cameras
- One card per camera: name, snapshot, time, latency
- Card actions: Refresh, Open, Options (Open/Options can be stubs for now)

### Extra actions

- Change layout (stub OK)
- Lock order (stub OK)
- More → go to `/app/cameras`

---

## Navigation

| Event | Action |
|-------|--------|
| Not logged in | → `/setup/login` |
| Setup finished | → `/app/home` |
| `/app` | → `/app/home` |
| More | → `/app/cameras` |

---

## Rules

- Code in `src/features/home/`
- Do not import from `cameras`
- Thin routes only — no forms/API in route files
- Use `paths.app.*.getHref()` — no hardcoded URLs
