# Folder Structure

Complete reference for every directory under `src/`. Use this when deciding **where a new file belongs**.

## Top-Level Map

```
src/
├── app/                 # Application shell — routes, router, providers
├── assets/              # Static assets imported by components (SVG, images)
├── components/          # Shared, cross-feature UI
├── config/              # Global configuration (paths, env)
├── features/            # Domain features (primary development area)
├── lib/                 # Third-party library setup and app infrastructure
├── testing/             # Test utilities, MSW mocks, data generators
├── types/               # Shared TypeScript types (API envelopes, entities)
├── utils/               # Pure utility functions (no React, no side effects)
├── index.css            # Global Tailwind + CSS variables
├── main.tsx             # Vite entry point
└── vite-env.d.ts        # Vite type references
```

## `app/` — Application Layer

Orchestrates routing and global providers. **No business logic.**

```
app/
├── index.tsx            # Root App component
├── provider.tsx         # Global providers wrapper
├── router.tsx           # Route definitions + lazy loading
└── routes/
    ├── setup/           # Setup wizard pages (thin route files)
    │   ├── login.tsx
    │   ├── register.tsx
    │   ├── master-slave.tsx
    │   ├── company.tsx
    │   ├── company-branch.tsx
    │   ├── company-address.tsx
    │   ├── device.tsx
    │   └── user.tsx
    └── app/             # Dashboard application pages
        ├── root.tsx     # Layout route (DashboardLayout + Outlet)
        ├── dashboard.tsx
        └── cameras.tsx
```

### Route file responsibilities

| Do | Don't |
|----|-------|
| Set page title via `<Head>` | Define Zod schemas |
| Choose layout (`SetupLayout`, pass-through for dashboard) | Call Axios directly |
| Auth / prerequisite guards (`useEffect` + `navigate`) | Large JSX trees |
| Wire `onSuccess` / `onBack` navigation | Map API payloads |

### When to create a route file

Create `app/routes/<area>/<name>.tsx` when:

- A new URL needs a page component
- The page needs layout wrapping or route-level guards

## `features/` — Feature Modules

Primary location for domain code. Each feature is self-contained.

### Standard feature anatomy

```
features/<feature-name>/
├── api/                 # Fetchers + React Query hooks
│   ├── get-<resource>.ts
│   ├── create-<resource>.ts
│   └── update-<resource>.ts
├── components/          # Feature-specific UI
│   ├── <feature>-form.tsx
│   ├── <feature>-list.tsx
│   └── <feature>-card.tsx
├── hooks/               # Feature hooks (create only when reused 2+ times)
├── stores/              # Zustand stores (create only when needed)
├── types/               # Feature-only types (not shared across features)
├── utils/               # Feature-only pure helpers
└── config.ts            # Feature constants (optional)
```

### Subfolder creation rules

| Folder | Create when… | Skip when… |
|--------|--------------|------------|
| `api/` | Feature calls backend or needs cached server data | Pure UI with no data fetching |
| `components/` | Feature has UI beyond a single inline element | — |
| `hooks/` | Same hook logic used in 2+ components | Logic fits in one component |
| `stores/` | Client state spans multiple components and isn't server data | `useState` is enough |
| `types/` | Types are feature-private and not API entities | Types belong in `types/api.ts` |
| `utils/` | Pure helpers used multiple times in the feature | One-off logic in component |

### Current features

| Feature | Purpose | API wired? |
|---------|---------|------------|
| `auth` | Login, register, session | Yes |
| `company` | Company registration | Yes |
| `company-branch` | Branch registration | Yes |
| `company-address` | Address form + countries/states | Yes |
| `device` | Device registration form | Local only |
| `user` | User registration form | Local only |
| `master-slave` | Device role selection | Local only |
| `setup` | Wizard layout, stepper, shared config | — |
| `dashboard` | App shell, sidebar, logo | — |

### Naming features

- Use **kebab-case** directory names matching the domain: `company-address`, not `CompanyAddress`
- One feature per business domain — don't split `company-address` into `countries` and `addresses` unless they become independent products

## `components/` — Shared UI

Reusable presentation components with **no feature-specific business logic**.

```
components/
├── errors/
│   └── main.tsx         # Global error fallback
├── seo/
│   ├── head.tsx         # react-helmet-async page titles
│   └── index.ts
└── ui/
    ├── button/
    ├── form/            # Form, Input, Select, Label, Error
    ├── link/
    ├── notifications/   # Toast system (Zustand store)
    └── spinner/
```

### When to add to `components/ui/`

Add here only when:

- Used by **2 or more features**, OR
- It's a generic primitive (Button, Input, Spinner)

Keep feature-specific forms in `features/<name>/components/`.

### UI component structure

```
components/ui/<name>/
├── <name>.tsx           # Component implementation
├── index.ts             # Re-export
└── __tests__/           # Unit tests (optional)
    └── <name>.test.tsx
```

## `config/` — Global Configuration

```
config/
├── env.ts               # Zod-validated environment variables
└── paths.ts             # Central URL registry (single source of truth)
```

**Never hardcode paths** in components — always use `paths.*.getHref()`.

## `lib/` — Infrastructure

Preconfigured integrations. Not business features.

```
lib/
├── api-client.ts        # Axios instance + interceptors
├── auth.tsx             # react-query-auth setup, useUser, AuthLoader
├── auth-tokens.ts       # JWT read/write/clear in localStorage
└── react-query.ts       # Query defaults + MutationConfig types
```

Do not add feature logic here. If `lib/` grows, it means infrastructure — not domains.

## `types/` — Shared Types

```
types/
└── api.ts               # ApiResponse, User, Company, Address, payloads, …
```

| Put in `types/api.ts` | Put in `features/*/types/` |
|-----------------------|----------------------------|
| Backend response entities | UI-only view models |
| Shared request payloads | Form-specific intermediate types |
| `ApiResponse<T>` envelope | Component prop types (inline or co-located) |

## `utils/` — Pure Utilities

```
utils/
└── cn.ts                # Tailwind class merge (clsx + tailwind-merge)
```

Functions here must be **pure** — no React hooks, no API calls, no `localStorage`.

## `testing/` — Test Infrastructure

```
testing/
├── setup-tests.ts       # Vitest global setup
├── test-utils.tsx       # Custom render with providers
├── data-generators.ts   # Fake data for tests
└── mocks/
    ├── browser.ts       # MSW worker (dev)
    ├── server.ts        # MSW server (tests)
    ├── db.ts            # In-memory mock DB
    ├── handlers/        # Per-domain MSW handlers
    └── index.ts
```

## `assets/` — Static Files

```
assets/
└── logo.svg
```

Import in components: `import logo from '@/assets/logo.svg'`

For public URLs without bundling, use `public/` (e.g. `favicon.ico`, `robots.txt`).

## File Naming Conventions

| Kind | Pattern | Example |
|------|---------|---------|
| React component file | `kebab-case.tsx` | `company-address-form.tsx` |
| React component export | `PascalCase` | `CompanyAddressForm` |
| Hook file | `use-kebab-case.ts` | `use-countries.ts` |
| API fetcher file | `<verb>-<resource>.ts` | `register-address.ts`, `get-countries.ts` |
| Utility file | `kebab-case.ts` | `format-date.ts` |
| Type file | `kebab-case.ts` | `api-types.ts` |
| Test file | `<name>.test.ts(x)` | `form.test.tsx` |
| Route file | `kebab-case.tsx` | `company-address.tsx` |
| Config file | `config.ts` or `kebab-case.ts` | `paths.ts`, `env.ts` |

## Import Aliases

All `src/` imports use the `@/` prefix:

```typescript
import { Button } from '@/components/ui/button';
import { useCountries } from '@/features/company-address/api/get-countries';
import { paths } from '@/config/paths';
```

Configured in `tsconfig.json` and `vite.config.ts`.

## See Also

- [Feature Development](./03-feature-development.md) — step-by-step file creation
- [Conventions](./09-conventions.md) — naming and import order
