# AGENTS

This file is the rulebook for the **react-vite** frontend.

The app currently has:

1. **Setup wizard** — company, branch, address, user, device onboarding

Post-setup app modules (not implemented yet):

- **Home** — see `home_specs.md`
- **Cameras** — see `cameras_specs.md`
- **App shell** — layout/sidebar; documented in `home_specs.md`

Follow these rules when adding or changing code.

---

# Project Structure

```
apps/react-vite/
├── AGENTS.md
├── README.md
├── home_specs.md
├── cameras_specs.md
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.cjs
├── postcss.config.cjs
├── playwright.config.ts
├── .eslintrc.cjs
├── public/
│   ├── _redirects
│   ├── robots.txt
│   └── mockServiceWorker.js
├── e2e/
│   └── tests/
│       ├── auth.setup.ts
│       └── auth.spec.ts
└── src/
    ├── main.tsx
    ├── index.css
    ├── vite-env.d.ts
    ├── app/
    │   ├── index.tsx
    │   ├── provider.tsx
    │   ├── router.tsx
    │   └── routes/
    │       ├── setup/
    │       │   ├── login.tsx
    │       │   ├── register.tsx
    │       │   ├── master-slave.tsx
    │       │   ├── company.tsx
    │       │   ├── company-branch.tsx
    │       │   ├── company-address.tsx
    │       │   ├── device.tsx
    │       │   └── user.tsx
    │       └── app/                    # planned — see home_specs.md / cameras_specs.md
    │           ├── root.tsx
    │           ├── home.tsx
    │           └── cameras.tsx
    ├── assets/
    │   └── logo.svg
    ├── components/
    │   ├── errors/
    │   │   └── main.tsx
    │   ├── seo/
    │   │   ├── head.tsx
    │   │   └── index.ts
    │   └── ui/
    │       ├── button/
    │       ├── form/
    │       ├── link/
    │       ├── notifications/
    │       └── spinner/
    ├── config/
    │   ├── env.ts
    │   └── paths.ts
    ├── features/
    │   ├── auth/
    │   │   ├── api/
    │   │   │   ├── login.ts
    │   │   │   ├── register.ts
    │   │   │   └── get-user.ts
    │   │   └── components/
    │   │       ├── login-form.tsx
    │   │       └── register-form.tsx
    │   ├── company/
    │   │   ├── api/
    │   │   │   └── register-company.ts
    │   │   └── components/
    │   │       └── company-form.tsx
    │   ├── company-branch/
    │   │   ├── api/
    │   │   │   └── register-branch.ts
    │   │   └── components/
    │   │       └── company-branch-form.tsx
    │   ├── company-address/
    │   │   ├── api/
    │   │   │   ├── get-countries.ts
    │   │   │   ├── get-states.ts
    │   │   │   └── register-address.ts
    │   │   └── components/
    │   │       └── company-address-form.tsx
    │   ├── device/
    │   │   └── components/
    │   │       └── device-form.tsx
    │   ├── user/
    │   │   └── components/
    │   │       └── user-form.tsx
    │   ├── master-slave/
    │   │   └── components/
    │   │       └── master-slave-form.tsx
    │   ├── setup/
    │   │   ├── config.ts
    │   │   └── components/
    │   │       ├── setup-layout.tsx
    │   │       └── setup-stepper.tsx
    │   ├── app-shell/                 # planned
    │   │   └── components/
    │   │       ├── app-shell-layout.tsx
    │   │       ├── app-sidebar.tsx
    │   │       └── atomo-logo.tsx
    │   ├── home/                      # planned — see home_specs.md
    │   │   └── components/
    │   │       ├── home-page.tsx
    │   │       ├── recent-events.tsx
    │   │       └── camera-feed-grid.tsx
    │   └── cameras/                   # see cameras_specs.md
    │       ├── components/
    │       │   └── cameras-page.tsx
    │       ├── adopted/
    │       │   ├── api/               # empty for now
    │       │   └── components/
    │       │       └── adopted-cameras.tsx
    │       ├── discover/
    │       │   ├── api/               # empty for now
    │       │   └── components/
    │       │       └── discover-cameras.tsx
    │       ├── connect/
    │       │   ├── api/               # empty for now
    │       │   └── components/
    │       │       └── connect-camera-form.tsx
    │       └── add/
    │           ├── api/               # empty for now
    │           └── components/
    │               └── add-camera-form.tsx
    ├── lib/
    │   ├── api-client.ts
    │   ├── auth.tsx
    │   ├── auth-tokens.ts
    │   └── react-query.ts
    ├── testing/
    │   ├── setup-tests.ts
    │   ├── test-utils.tsx
    │   ├── data-generators.ts
    │   └── mocks/
    │       ├── browser.ts
    │       ├── server.ts
    │       ├── db.ts
    │       ├── index.ts
    │       └── handlers/
    │           ├── index.ts
    │           └── auth.ts
    ├── types/
    │   └── api.ts
    └── utils/
        └── cn.ts
```

## Features (current modules)

| Feature | What it does |
|---------|----------------|
| `auth` | Login, register, session |
| `company` | Company registration |
| `company-branch` | Branch registration |
| `company-address` | Address form + countries/states |
| `device` | Device registration |
| `user` | User registration |
| `master-slave` | Master / slave selection |
| `setup` | Wizard layout, stepper, setup state |
| `app-shell` | App layout + sidebar (planned; see `home_specs.md`) |
| `home` | Home page — events + camera grid (planned; see `home_specs.md`) |
| `cameras` | Cameras — list, discover, connect, add (planned; see `cameras_specs.md`) |

## Feature folder template

Create only the folders you need:

```
src/features/<name>/
├── api/           # Fetchers + React Query hooks
├── components/    # Feature UI
├── hooks/         # Only if reused in 2+ components
├── stores/        # Only if needed
├── types/         # Feature-only types
└── utils/         # Feature-only helpers
```

## Routes

| Area | Folder | URLs |
|------|--------|------|
| Setup wizard | `src/app/routes/setup/` | `/setup/login` … `/setup/user` |
| App (planned) | `src/app/routes/app/` | `/app/home`, `/app/cameras` |

- All URLs live in `src/config/paths.ts`
- Router lives in `src/app/router.tsx`
- Setup pages use `SetupLayout`
- App pages use `AppShellLayout` (planned)
- Specs: `home_specs.md`, `cameras_specs.md`

---

# Coding Style

## Naming

| Kind | Style | Example |
|------|--------|---------|
| Files and folders | kebab-case | `company-address-form.tsx` |
| React components | PascalCase | `CompanyAddressForm` |
| Functions and variables | camelCase | `registerAddress` |
| Hooks | `use-kebab-case.ts` | `use-countries.ts` |
| API files | verb + resource | `get-countries.ts`, `register-address.ts` |

## TypeScript

- Strict mode is on
- Define types before writing the feature
- Import from `src` with `@/` — example: `@/components/ui/button`

## Components

- One component = one job
- Prefer children/slots over too many props
- Move large JSX into its own component
- Style with Tailwind CSS
- Shared UI lives in `src/components/ui/`

## State

| Kind of state | Use |
|---------------|-----|
| Local UI | `useState` / `useReducer` |
| Server data | TanStack Query |
| Forms | React Hook Form + Zod |
| Toasts | Zustand (`notifications`) |
| Setup wizard progress | `localStorage` via `features/setup/config.ts` |

Keep state close to where it is used. Do not make it global unless needed.

## API files

Each endpoint should have:

1. Types
2. Fetcher function (`api.get` / `api.post`)
3. React Query hook (`useQuery` / `useMutation`)

Map form camelCase to backend snake_case in the API file, not in the component.

## Routes

Route files should stay thin:

- Set the page title
- Check login / previous steps if needed
- Render the feature component

Do not put forms or API mapping in route files.

---

# Boundaries

Code may only flow in this direction:

```
shared (components, lib, config, types, utils)
    ↓
features
    ↓
app (routes, router)
```

## Do

- Features import shared UI, `lib/api-client`, `config/paths`, `types/api`
- Routes import feature components
- Put related code next to where it is used

## Do not

- Import one feature from another (`auth` must not import `company`)
- Put business logic in `src/components/ui/`
- Put forms or API calls in `src/app/routes/`
- Hardcode URLs — use `paths.*.getHref()`
- Add `hooks/`, `stores/`, or `utils/` inside a feature until you actually need them

Shared UI (`components/ui/`) is only for pieces used by **2 or more** features.

---

# Security

## Auth

- JWT access + refresh tokens are stored in `localStorage` (`src/lib/auth-tokens.ts`)
- Axios adds `Authorization: Bearer <token>` on every request
- On 401, the API client sends the user to `/setup/login`
- Client-side route checks are for UX only — the backend must still enforce access

## Forms and XSS

- Validate with Zod before submit
- Do not render unsanitized HTML from users
- Escape data at the UI boundary

## Errors

- API errors show a toast from the Axios interceptor
- Missing required fields in an API response should throw in the fetcher
- Use error boundaries for broken UI

## Env

- Backend URL comes from `VITE_APP_API_URL`
- Env is validated in `src/config/env.ts` — the app will not start with bad env

---

# Tools to Use

## Run the app

```bash
yarn install
yarn dev
yarn test
yarn lint
yarn check-types
yarn build
```

## Stack

| Job | Tool |
|-----|------|
| App | React 18 + TypeScript + Vite |
| Routing | React Router 7 |
| Server state | TanStack Query |
| HTTP | Axios (`src/lib/api-client.ts`) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Client state | Zustand |
| Tests | Vitest + Testing Library |
| API mocks | MSW |
| E2E | Playwright |

## How to add a new screen

1. Add the URL in `src/config/paths.ts`
2. Add the route in `src/app/router.tsx`
3. Create a thin page in `src/app/routes/`
4. Put UI in `src/features/<name>/components/`
5. Put API calls in `src/features/<name>/api/`

