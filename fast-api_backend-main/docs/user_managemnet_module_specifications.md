# User Management Module Specification

> Module: `app/user_management` (new — not yet implemented)
> Status: To be built
> Related: `AGENTS.md`, `specifications.md`, `company_module_specifications.md`
>
> **Note:** `auth_module_specs.md` has been removed. This module now owns
> everything it previously covered — authentication (registration, login,
> JWT/refresh tokens, password reset), profile management — merged with
> user/role/permission management (RBAC). There is no separate `auth`
> module.

---

## 1. Overview

The `user_management` module owns the full user lifecycle: registration,
login/authentication, session/token management, password recovery,
profile management, and role-based access control (RBAC) within a
company — adding/removing users, assigning them one of four fixed roles
(Owner, Admin, Operator, Viewer), and enforcing the permission matrix that
determines what each role can do across every other module (device,
camera, alerts, reports, etc.).

It is the identity source of truth for the rest of the app — other
modules never manage users themselves and instead depend on
`UserManagementGateway` and the `CurrentUser`/`ActiveUser` dependencies
this module exposes.

Entity relationships (from ER diagram):
- `User` belongs to a `Company` (`company_id` FK) and has one `role_id` FK
  directly on the table, **and** a separate `user_role` join table also
  links `user_id` ↔ `role_id` with `assigned_by`/`assigned_at`. These two
  representations need reconciling (see §6).
- `Roles` has a `company_id` FK — meaning roles are modeled **per
  company**, not as 4 global system rows, despite the RBAC spec
  describing 4 fixed, company-agnostic roles (Owner/Admin/Operator/Viewer).
- `Role_permission` is the junction table: one row per `(role_id,
  permission_id)` pair, with `is_allowed` (bool).
- `permission` holds one row per action (50 total per the RBAC doc),
  tagged by `module` (e.g. "Camera") and `action` (e.g. "add").
- `RefreshToken` (not shown on the ER diagram — needs to be added) has a
  many-to-one relationship to `User`, for token refresh/revocation.

---

## 2. Functional Specifications

### 2.1 User Stories

**Authentication & account**
- As the Owner of a company (created at company registration — see §6),
  I can add new users to my company.
- As a visitor, I can register a new account (or be added by an
  Owner/Admin — see §6 on the registration flow).
- As a user, I can log in with my credentials and receive access/refresh
  tokens.
- As the **Owner**, I must complete a second authentication factor (2FA)
  at login, in addition to my password — see §2.4/§5.
- As a logged-in user, I can refresh my access token without re-entering
  credentials.
- As a user who forgot my password, I can request a password reset and
  set a new password via an emailed link/token.
- As a logged-in user, I can view and update my own profile.

**User & role management**
- As an Owner or Admin, I can edit a user's details, reset their
  password, force-logout a session, and enable/disable their account.
- As an Owner, I can remove a user entirely; Admins cannot.
- As an Owner or Admin, I can assign a role to a user — but an Admin may
  only assign Operator or Viewer, never Owner or Admin (enforced in
  application logic, not the DB).
- As any authenticated user, my role determines what I can see/do across
  every module (device, camera, AI models, alerts, reports, logs,
  settings) per the permission matrix in §2.4.
- As an Owner or Admin, I can view a user's activity log.
- As a Viewer, I can view dashboards/cameras/reports but take no actions.
- As another module (e.g. `device`, `event`), I can resolve "who is
  making this request" and check "does this user have permission X"
  through the `user_management` Gateway, without querying
  `User`/`Role_permission`/`permission` tables directly.

### 2.2 Features

| Feature | Description |
|---|---|
| Registration | Create a new user account; triggers a welcome/registration email |
| Login | Validate credentials, issue a JWT access token + refresh token |
| **2FA for Owner** | Owner accounts require a second factor (TOTP) at login, on top of password — see §5 |
| Token refresh | Exchange a valid refresh token for a new access/refresh pair |
| Password restore/reset | Two-step flow: request reset (emails a token/link), then reset with that token |
| Profile management | Authenticated user can view and update their own profile |
| User CRUD (within a company) | Add, view, update, remove users scoped to a `company_id` |
| Role assignment | Assign one of 4 roles to a user, with the Admin-can't-grant-Owner/Admin restriction |
| Permission enforcement | Server-side check on every API call across every module — never UI-only |
| Account lifecycle | Enable/disable user, reset password, force logout (revoke refresh tokens) |
| Activity/audit visibility | Owner/Admin can view a user's activity log (backed by `Logs`, owned by the `audit` module) |
| Password hashing | Passwords hashed at rest (never stored/logged in plaintext) |
| Permission matrix seed | 4 roles × 50 permissions × `is_allowed` mapping, seeded per the RBAC doc (§2.4) |
| Cross-module identity & permission checks | Other modules resolve the current user and check permissions via `UserManagementGateway` — never re-implement role logic or query these tables directly |
| Domain events | User/role lifecycle events for other modules to react to (see §4.5) |

### 2.3 Roles Overview

| role_id | role_name | Description |
|---|---|---|
| 1 | **Owner** | Full control over the device — users, licenses, security, billing, factory reset. Single highest authority per company/device. **Requires 2FA.** |
| 2 | **Admin** | Operational control — cameras, AI models, alerts, reports, user management (excluding Owner-level actions). |
| 3 | **Operator** | Day-to-day monitoring — views dashboard, acknowledges alerts, restarts streams, exports limited reports. No configuration rights. |
| 4 | **Viewer** | Read-only — views cameras, dashboards, and reports. No action rights. |

> Maps to `Roles.role_name` enum: `owner`, `admin`, `operator`, `viewer`.
> Two roles from the original SOW (**Maintenance Engineer**, **Developer**)
> were intentionally excluded to keep the system to 4 roles — can be added
> later as new `Roles` rows without a schema change, **if** roles end up
> being global rather than per-company (see §6).

### 2.4 Permission Matrix

Legend: ✔ = Allowed · ✘ = Not Allowed

#### 2.4.1 Device & Onboarding

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| View device overview / health | ✔ | ✔ | ✔ | ✔ |
| Edit device name / location / timezone | ✔ | ✔ | ✘ | ✘ |
| Restart device | ✔ | ✔ | ✘ | ✘ |
| Shutdown device | ✔ | ✘ | ✘ | ✘ |
| Factory reset | ✔ | ✘ | ✘ | ✘ |
| Set device role (standalone/master/slave) | ✔ | ✘ | ✘ | ✘ |

#### 2.4.2 User & Role Management

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| Add user | ✔ | ✔ | ✘ | ✘ |
| Edit user | ✔ | ✔ | ✘ | ✘ |
| Remove user | ✔ | ✘ | ✘ | ✘ |
| Assign / change role | ✔ | ✔¹ | ✘ | ✘ |
| Reset user password | ✔ | ✔ | ✘ | ✘ |
| Force logout user | ✔ | ✔ | ✘ | ✘ |
| Enable / disable user | ✔ | ✔ | ✘ | ✘ |
| View user activity log | ✔ | ✔ | ✘ | ✘ |

¹ Admin may only assign the Operator or Viewer roles, not Owner or Admin — enforce in application logic.

#### 2.4.3 Camera Management

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| Add camera | ✔ | ✔ | ✘ | ✘ |
| Edit camera | ✔ | ✔ | ✘ | ✘ |
| Delete camera | ✔ | ✔ | ✘ | ✘ |
| View camera list / status | ✔ | ✔ | ✔ | ✔ |
| Live view / AI overlay | ✔ | ✔ | ✔ | ✔ |
| Restart camera stream | ✔ | ✔ | ✔ | ✘ |
| Assign AI model to camera | ✔ | ✔ | ✘ | ✘ |

#### 2.4.4 AI Model Management (Recognition Tabs)

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| View model tabs / status | ✔ | ✔ | ✔ | ✔ |
| Configure threshold / zones / FPS | ✔ | ✔ | ✘ | ✘ |
| Start / stop inference | ✔ | ✔ | ✘ | ✘ |
| Enroll faces / manage face database | ✔ | ✔ | ✘ | ✘ |

#### 2.4.5 Custom AI Model Upload

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| Upload model package | ✔ | ✔ | ✘ | ✘ |
| Validate / test model | ✔ | ✔ | ✘ | ✘ |
| Delete / deactivate model | ✔ | ✔ | ✘ | ✘ |
| View custom models | ✔ | ✔ | ✔ | ✔ |

#### 2.4.6 Alerts

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create / edit / delete alert rule | ✔ | ✔ | ✘ | ✘ |
| View alerts | ✔ | ✔ | ✔ | ✔ |
| Acknowledge alert | ✔ | ✔ | ✔ | ✘ |
| Escalate / mark false positive | ✔ | ✔ | ✔ | ✘ |
| Configure notification channels | ✔ | ✔ | ✘ | ✘ |

#### 2.4.7 Reports

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| View reports | ✔ | ✔ | ✔ | ✔ |
| Generate / export full report | ✔ | ✔ | ✘ | ✘ |
| Export limited report | ✔ | ✔ | ✔ | ✘ |
| Schedule recurring reports | ✔ | ✔ | ✘ | ✘ |

#### 2.4.8 Logs & Audit Trail

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| View system / camera / model logs | ✔ | ✔ | ✔ | ✘ |
| View audit trail | ✔ | ✔ | ✘ | ✘ |

#### 2.4.9 Master–Slave Devices

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| Add / remove slave device | ✔ | ✔ | ✘ | ✘ |
| View device-wise consumption | ✔ | ✔ | ✔ | ✔ |
| Reconnect / manage slave | ✔ | ✔ | ✘ | ✘ |

#### 2.4.10 Settings, Security, License, OTA, Backup

| Permission | Owner | Admin | Operator | Viewer |
|---|:---:|:---:|:---:|:---:|
| Manage network settings | ✔ | ✔ | ✘ | ✘ |
| **Manage security settings (2FA, tokens, IP whitelist)** | ✔ | ✘ | ✘ | ✘ |
| Manage license | ✔ | ✘ | ✘ | ✘ |
| Manage cloud sync / Atomic Centre account | ✔ | ✘ | ✘ | ✘ |
| Backup & restore | ✔ | ✘ | ✘ | ✘ |
| Perform OTA update | ✔ | ✘ | ✘ | ✘ |
| Manage billing | ✔ | ✘ | ✘ | ✘ |

> This is the row that motivates §5's 2FA requirement: only the Owner can
> *manage* security settings including 2FA/tokens/IP whitelist. This spec
> goes further and says the Owner must also *have* 2FA enabled on their
> own login — since it's the only role that can wipe a device
> (`Factory reset`) or touch billing/license/backups, it's the highest-value
> account to protect. Confirm this stricter reading matches intent (see §6).

### 2.5 ER Table Mapping

```
Roles (role_id PK, role_name, ...)
   │
   │ 1:N
   ▼
Role_permission (id PK, role_id FK, permission_id FK, is_allowed, is_deleted)
   ▲
   │ N:1
   │
permission (permission_id PK, name, module, action, description)

User (user_id PK, role_id FK, company_id FK, ...) ──1:N──▶ RefreshToken
```

- `Roles` holds the 4 fixed roles (per company, per §6's open question).
- `permission` holds one row per action listed in §2.4 (50 total), tagged
  with `module` (e.g. "Camera") and `action` (e.g. "add").
- `Role_permission` is the junction table: one row per `(role, permission)`
  pair with `is_allowed = true/false`, exactly matching the matrices above.
- `User` links to a role via `user_role` (`user_id`, `role_id`), so each
  user inherits the permission set of their assigned role.
- `RefreshToken` is not on the current ER diagram — add it as part of
  this module's migration (see §3).
- A ready-to-run seed (`role_permission_seed.sql`) implementing this exact
  matrix — 4 roles, 50 permissions, 200 role-permission mappings — should
  back §2.4 above; see §5 Non-Functional Requirements for seeding strategy.

---

## 3. Data Model

| Entity | Key fields | Relationships |
|---|---|---|
| `User` | user_id (PK), role_id (FK), company_id (FK), name, email, password_hash, mfa_secret (nullable), mfa_enabled (bool, default false), status (active/disabled), audit fields | Belongs to `Company` (cross-module); has one `role_id` directly, also linked via `user_role`; has many `RefreshToken` |
| `user_role` | user_role_id (PK), user_id (FK), role_id (FK), assigned_by, assigned_at | Join table between `User` and `Roles` |
| `Roles` | role_id (PK), role_name (enum: owner/admin/operator/viewer), audit fields | Belongs to a `Company`; has many `Role_permission` |
| `Role_permission` | id (PK), role_id (FK), permission_id (FK), is_allowed (bool), audit fields | Junction: `Roles` ↔ `permission` |
| `permission` | permission_id (PK), name, module, action, description, audit fields | Referenced by `Role_permission` |
| `RefreshToken` *(new — not on ER diagram)* | id (PK), user_id (FK), token, expires_at, revoked (bool), audit fields | Belongs to `User`; used for refresh + revocation ("force logout") |

> Audit fields follow the repo-wide convention: `created_at`, `created_by`,
> `updated_at`, `updated_by`, `is_system_record` (bool), `is_deleted`
> (bool) — from `BaseModel`/`SoftDeleteMixin`.
>
> `mfa_secret`/`mfa_enabled` on `User` are new fields needed for §5's 2FA
> requirement — not on the original ER diagram, need adding.

---

## 4. Interfaces

### 4.1 REST API (`app/user_management/routes/v1/`)

**Authentication (unauthenticated except where noted)**

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create a new user account (see §6 on how this relates to company registration) |
| POST | `/auth/login` | No | Validate credentials; if `mfa_enabled`, returns a challenge instead of tokens |
| POST | `/auth/login/verify-2fa` | Partial (login challenge token) | Submit TOTP code to complete a 2FA login, receive access + refresh tokens |
| POST | `/auth/refresh-token` | Refresh token | Issue a new access/refresh token pair |
| POST | `/auth/restore-password` | No | Request a password reset (sends email) |
| POST | `/auth/reset-password` | Reset token | Set a new password using the reset token |
| POST | `/auth/2fa/enable` | Yes (Owner) | Begin 2FA setup — returns TOTP secret/QR |
| POST | `/auth/2fa/confirm` | Yes (Owner) | Confirm 2FA setup with a valid code, activates `mfa_enabled` |
| POST | `/auth/2fa/disable` | Yes (Owner) | Disable 2FA (should itself require re-auth/current code) |

**Profile**

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/profile` | Yes | Get the current user's profile |
| PATCH | `/profile` | Yes | Update the current user's profile |

**User & role management (see §2.4.2 for exact per-role access)**

| Method | Path | Min. role | Description |
|---|---|---|---|
| GET | `/companies/{company_id}/users` | Owner, Admin | List users in a company |
| POST | `/companies/{company_id}/users` | Owner, Admin | Add a user to a company |
| GET | `/users/{id}` | Owner, Admin (self for others) | Get a single user |
| PATCH | `/users/{id}` | Owner, Admin | Update a user |
| DELETE | `/users/{id}` | Owner only | Remove a user |
| PATCH | `/users/{id}/role` | Owner, Admin¹ | Assign/change a user's role |
| POST | `/users/{id}/enable` / `/disable` | Owner, Admin | Enable/disable a user |
| POST | `/users/{id}/reset-password` | Owner, Admin | Trigger a password reset for a user |
| POST | `/users/{id}/force-logout` | Owner, Admin | Revoke a user's active refresh tokens |
| GET | `/users/{id}/activity-log` | Owner, Admin | View a user's activity log |
| GET | `/roles` | Any authenticated | List roles (and their permissions) available |
| GET | `/roles/{id}/permissions` | Any authenticated | List permissions for a role |

¹ Admin may only set role to Operator/Viewer — enforced in the service
layer, not the DB, per §2.4.2.

### 4.2 DI Wiring (`app/user_management/dependencies/`)

| File | Exposes (indicative) |
|---|---|
| `dependencies/repositories.py` | `UserRepositoryDep`, `RefreshTokenRepositoryDep`, `RoleRepositoryDep`, `RolePermissionRepositoryDep`, `PermissionRepositoryDep` |
| `dependencies/services.py` | `UserServiceDep`, `AuthServiceDep`, `RoleServiceDep`, `PermissionServiceDep` |

### 4.3 Exposed Dependencies (`app/user_management/__init__.py`)

| Export | Type | Purpose |
|---|---|---|
| `CurrentUser` | DI dependency | Resolves the authenticated user from the access token (may be inactive) |
| `ActiveUser` | DI dependency | Same, but only for active/enabled users |
| `UserManagementGateway` | DI dependency (Gateway) | Only sanctioned way other modules read user data or check permissions |
| `RequirePermission` | DI dependency factory | e.g. `Depends(RequirePermission("camera.add"))` — used as a route dependency in *other* modules |
| `UserDTO` / `RoleDTO` / `PermissionDTO` | Pydantic DTOs | Cross-module-safe representations |
| `router_v1` | APIRouter | Registered centrally in `app.core.routers` |

### 4.4 Gateway Interface (`gateway.py`)

```python
class UserManagementGatewayInterface(ABC):
    async def get_user(self, user_id: int) -> UserDTO: ...
    async def get_user_list(self, params: ListParams) -> PaginatedResult[UserDTO]: ...
    async def get_users_by_company(self, company_id: int) -> list[UserDTO]: ...
    async def has_permission(self, user_id: int, permission_name: str) -> bool: ...
    async def get_role(self, role_id: int) -> RoleDTO: ...
```

### 4.5 Events (`events.py`)

| Event | Dispatched when | Payload (indicative) |
|---|---|---|
| `UserCreated` | A new user finishes registration | `user_id`, `email`, `company_id` |
| `UserAddedToCompany` | A user is added to a company by an Owner/Admin | `user_id`, `company_id`, `role_id` |
| `UserRoleChanged` | A user's role is reassigned | `user_id`, `old_role_id`, `new_role_id` |
| `UserDeleted` / `UserRemoved` | A user's account is deleted/removed | `user_id`, `company_id` |
| `UserDisabled` | A user is disabled | `user_id` |
| `TwoFactorEnabled` | Owner successfully enables 2FA | `user_id` |

### 4.6 Emails (`emails/`)

| Template | Sent when |
|---|---|
| `user_registration.html` | After successful registration |
| `password_reset.html` | After a password reset is requested |
| `two_factor_enabled.html` | After 2FA is enabled on an account (security notice) |

---

## 5. Non-Functional Requirements

- Passwords hashed with PassLib; never logged or returned in any response.
- JWTs signed/verified via PyJWT; access tokens short-lived, refresh
  tokens longer-lived and revocable (`RefreshToken` table).
- **2FA is mandatory for the Owner role.** Rationale: Owner is the only
  role that can factory-reset a device, manage billing/license, and
  manage security settings themselves (§2.4.10) — the highest-value
  account to protect. Recommend TOTP (e.g. `pyotp`, an app like Google/
  Microsoft Authenticator) over SMS. Whether 2FA should also be
  *available* (optional) to Admin/Operator/Viewer, or Owner-only, is
  flagged in §6.
- Sensitive endpoints (login, register, restore-password, 2FA endpoints)
  should sit behind `ConfigurableRateLimiter` to slow brute-force/
  enumeration attacks.
- Every permission check happens **server-side**, on every request — per
  the RBAC doc's explicit note, never rely on UI hiding alone.
- The Admin-can-only-assign-Operator/Viewer rule is a business rule
  layered above the raw `Role_permission` table — enforce it in
  `RoleService`, not as a DB constraint.
- "Export limited report" (Operator) vs "export full report" (Admin) is
  a scope/field-level distinction inside the `report` module's service,
  not two separate endpoints — `user_management` only supplies the
  permission check; the scoping logic lives in `report`.
- All cross-module access to user/role/permission data goes through
  `UserManagementGateway` / DTOs — raw ORM rows never cross a module
  boundary.
- Seed data: the 4 roles × 50 permissions × `is_allowed` matrix from the
  RBAC doc should ship as a migration-time or startup seed
  (`role_permission_seed.sql`), not entered manually per company —
  directly relevant to the "roles are per-company" question in §6.

---

## 6. Open Questions

- **`User.role_id` vs `user_role` table**: the ER diagram has a direct
  `role_id` FK on `User` *and* a separate `user_role` join table. Is
  `user_role` meant to support multiple roles per user (future) while
  `role_id` is a denormalized "current primary role" cache? Or is one of
  these redundant and should be dropped?
- **Roles: global (4 fixed rows) or per-company?** The RBAC doc describes
  4 fixed, system-wide roles. The ER diagram's `Roles.company_id` FK
  implies each company gets its own copy of the 4 roles (and could
  diverge). If global, `Roles.company_id` may be wrong in the ER diagram;
  if per-company customization is intended, the seed script needs to run
  once *per company* at registration time.
- **This directly resolves part of the earlier `company` module open
  question** (who can register a company): if `Roles` are per-company,
  registering a company must also seed that company's 4 roles and create
  its first `User` as Owner, in one transaction — company registration
  and first-user creation are the same operation. Needs to be designed
  as a single cross-module flow (likely living here, or in a shared
  registration flow that both `company` and `user_management` call into).
- Whether `permission` rows (50 of them) are seeded once globally
  (shared across all companies) or duplicated per company — the ER
  diagram doesn't show a `company_id` on `permission` itself, suggesting
  global, which would be inconsistent with `Roles` having `company_id`.
- **2FA scope**: is 2FA mandatory for Owner *only*, or should it also be
  offered as an opt-in for Admin/Operator/Viewer? This spec currently
  assumes Owner-mandatory, everyone-else-none — confirm before building.
- **2FA method**: TOTP (authenticator app) assumed above — confirm vs.
  SMS/email-OTP, which have different infra requirements (SMS gateway,
  additional cost per login).
- Refresh token rotation/revocation-on-reuse behavior — decide before
  implementing `AuthService`.
- Exact scope of `GET /users` / `GET /users/{id}` beyond what's listed —
  confirm the "self-only vs Owner/Admin" boundary matches intent.