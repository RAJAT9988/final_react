# Frontend Documentation

Industrial-grade documentation for the **Atomo Device Setup & Dashboard** React application (`apps/react-vite`).

## Audience

- Frontend developers onboarding to the project
- Contributors adding features, routes, or API integrations
- Reviewers validating architecture and convention compliance

## Documentation Index

| Document | Purpose |
|----------|---------|
| [Architecture](./01-architecture.md) | System design, layers, dependency rules, tech stack |
| [Folder Structure](./02-folder-structure.md) | Every `src/` directory, file types, when to create each |
| [Feature Development](./03-feature-development.md) | End-to-end checklist for new features with worked examples |
| [Routing](./04-routing.md) | URL registry, router setup, setup wizard vs dashboard layouts |
| [API Integration](./05-api-integration.md) | Fetchers, React Query hooks, error handling, backend mapping |
| [Forms & Validation](./06-forms-and-validation.md) | React Hook Form + Zod patterns, shared form components |
| [State Management](./07-state-management.md) | Server state, setup wizard state, auth, notifications |
| [Testing](./08-testing.md) | Vitest, Testing Library, MSW, what to test |
| [Conventions](./09-conventions.md) | Naming, imports, TypeScript, styling, code review checklist |

## Related Documents

| Document | Location | Scope |
|----------|----------|-------|
| App README | [`../README.md`](../README.md) | Setup, env vars, scripts, wired API table |
| AGENTS.md | [`../../AGENTS.md`](../../AGENTS.md) | Monorepo-wide Bulletproof React guidelines |

## Quick Reference

### Application Areas

```
Setup Wizard (onboarding)     →  /setup/*
Dashboard (post-setup app)    →  /app/*
```

### Golden Examples (copy these patterns)

| Pattern | Reference |
|---------|-----------|
| GET + `useQuery` hook | `src/features/company-address/api/get-countries.ts` |
| POST + `useMutation` hook | `src/features/company-address/api/register-address.ts` |
| Form + API submission | `src/features/company-address/components/company-address-form.tsx` |
| Thin route + guards | `src/app/routes/setup/company-address.tsx` |
| Setup layout page | `src/features/setup/components/setup-layout.tsx` |
| Dashboard layout + sidebar | `src/features/dashboard/components/dashboard-layout.tsx` |
| Nested app routes | `src/app/routes/app/root.tsx` + `src/app/router.tsx` |

### File Creation Decision Tree

```
Need a new screen?
  ├─ Add path in config/paths.ts
  ├─ Add route in app/router.tsx
  └─ Create thin page in app/routes/

Need business UI?
  └─ Create feature in features/<name>/components/

Need backend data?
  └─ Create fetcher + hook in features/<name>/api/

Need reusable UI across features?
  └─ Create in components/ui/ (only if 2+ features use it)

Need feature-only state?
  ├─ Server data     → React Query (api/)
  ├─ Wizard progress → setup config (localStorage)
  └─ UI modals/toast → Zustand (components/ui/notifications)
```

## Maintaining These Docs

Update documentation when you:

- Add a new top-level `src/` directory
- Introduce a new architectural pattern (e.g. new state library)
- Change routing structure or URL conventions
- Add a new category of API integration (e.g. WebSocket, file upload)

Keep examples synchronized with real files in the repository — avoid hypothetical patterns that differ from production code.
