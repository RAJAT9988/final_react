# Company Feature Specs

This file describes the **company registration flow** in the setup wizard.

---

## Where it sits in the wizard

```
1 Login
2 Master / Slave
3 Company Registration   ← this feature
4 Company Branch
5 Company Address
6 Device
7 User
```

- **URL:** `/setup/company`
- **Step:** 3 of 7
- **Must be logged in** before this page opens
- **After success:** go to `/setup/company-branch`

---

## Flow

```
User opens /setup/company
        ↓
Not logged in? → redirect to /setup/login
        ↓
Show empty Company Registration form
        ↓
User fills fields and clicks Continue
        ↓
Zod validates the form
        ↓
POST /api/v1/company/register-company
        ↓
Backend returns company with UUID id
        ↓
Save company (id + form values) in setup state (localStorage key: bp-setup)
        ↓
Show success toast: "Company registered"
        ↓
Reset the form
        ↓
Navigate to /setup/company-branch
```

**Back** goes to `/setup/master-slave`.

---

## Files

| Role | Path |
|------|------|
| Route (thin page + login guard) | `src/app/routes/setup/company.tsx` |
| Form + validation | `src/features/company/components/company-form.tsx` |
| API fetcher + hook | `src/features/company/api/register-company.ts` |
| Shared types | `src/types/api.ts` |
| Setup state | `src/features/setup/config.ts` |
| URL | `src/config/paths.ts` → `paths.setup.company` |

---

## Form fields

| UI label | Form field (camelCase) | Backend field (snake_case) | Rules |
|----------|------------------------|----------------------------|--------|
| Company Name | `companyName` | `company_name` | Required, 3–64 chars, at least one letter |
| Company Description | `companyDescription` | `company_description` | Required, max 256 chars |
| Contact Person Name | `contactPersonName` | `contact_person_name` | Required, 3–64 chars, at least one letter |
| Contact Person Designation | `contactPersonDesignation` | `contact_person_designation` | Required, 2–64 chars, at least one letter |
| Contact Person Email | `contactPersonEmail` | `contact_person_email` | Required, valid email |
| Contact Person Mobile No. | `contactPersonMobile` | `contact_person_phone` | Required, 10–20 chars, digits / `+` / `-` / space |

The form always starts **empty**. Older values are not shown if the user comes back to this page.

---

## API

**Method:** `POST`  
**Endpoint:** `/api/v1/company/register-company`  
**Auth:** Bearer token (sent by Axios from `localStorage`)

### Request body

```json
{
  "company_name": "string (3–64)",
  "contact_person_name": "string (3–64)",
  "contact_person_email": "user@example.com",
  "contact_person_phone": "string (10–20)",
  "contact_person_designation": "string",
  "company_description": "string"
}
```

### Success response

```json
{
  "code": 200,
  "message": null,
  "data": {
    "id": "uuid",
    "company_name": "string",
    "contact_person_name": "string",
    "contact_person_email": "string",
    "contact_person_phone": "string",
    "contact_person_designation": "string",
    "company_description": "string",
    "status_id": null
  }
}
```

If `data.id` is missing, the frontend treats it as failure.

Errors show a toast from the Axios interceptor.

---

## What is saved after success

Stored in `localStorage` under `bp-setup` → `company`:

```json
{
  "companyId": "uuid-from-backend",
  "companyName": "...",
  "companyDescription": "...",
  "contactPersonName": "...",
  "contactPersonDesignation": "...",
  "contactPersonEmail": "...",
  "contactPersonMobile": "..."
}
```

`companyId` is required by the **branch** step (`POST /api/v1/company-branch/register-branch` needs `company_id`).

---

## Mapping (UI → API)

| Form | API |
|------|-----|
| `companyName` | `company_name` |
| `companyDescription` | `company_description` |
| `contactPersonName` | `contact_person_name` |
| `contactPersonDesignation` | `contact_person_designation` |
| `contactPersonEmail` | `contact_person_email` |
| `contactPersonMobile` | `contact_person_phone` |

Mapping happens in `register-company.ts` (`toCreatePayload`), not in the form.

---

## Guards and navigation

| Event | Action |
|-------|--------|
| User not logged in | Redirect to `/setup/login` |
| Click Back | Go to `/setup/master-slave` |
| Register success | Go to `/setup/company-branch` |

---

## Other company APIs (not used in this flow yet)

These exist on the backend but are **not** part of setup step 3:

| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/company` |
| GET | `/api/v1/company/{company_id}` |
| PATCH | `/api/v1/company/{company_id}` |
| DELETE | `/api/v1/company/{company_id}` |
