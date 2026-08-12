/**
 * Shared API types used by auth and the rest of the app.
 *
 * LOGIN (fast-api-backend): POST /api/v1/auth/login → tokens, then GET /api/v1/profile → User.
 */

/** Standard envelope from fast-api-backend Response[T]. */
export type ApiResponse<T> = {
  code: number;
  message: string | null;
  data?: T;
};

/** Fields every saved record usually has. */
export type BaseEntity = {
  id: string;
  // Mock API used a number; real backend returns an ISO date string
  createdAt: number | string;
};

/** Helper: take shape T and add id + createdAt. */
export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

/**
 * User from GET /api/v1/profile (fast-api-backend UserResponse).
 * Optional legacy fields kept for older mock/register paths.
 */
export type User = {
  id: number | string;
  email: string;
  username?: string | null;
  status_id?: number | string | null;
  firstName?: string;
  lastName?: string | null;
  mobile?: string | null;
  createdAt?: number | string;
  updatedAt?: number | string | null;
};

/** Token payload inside login response `data`. */
export type LoginTokenData = {
  access_token: string;
  refresh_token: {
    token: string;
    expires_at: string;
  };
  token_type: string;
};

/** Login result used by react-query-auth loginFn. */
export type AuthResponse = {
  jwt: string;
  user: User;
};

/**
 * Company from fast-api-backend (CompanyResponse).
 * Backend uses snake_case field names; ids are UUIDs.
 */
export type Company = {
  id: string;
  company_name: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  contact_person_designation: string | null;
  company_description: string | null;
  status_id?: number | string | null;
};

/** Body for POST /api/v1/company/register-company */
export type CompanyCreatePayload = {
  company_name: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  contact_person_designation: string;
  company_description: string;
};

/**
 * Company branch from fast-api-backend (CompanyBranchResponse).
 * Backend uses snake_case field names; ids are UUIDs.
 */
export type CompanyBranch = {
  id: string;
  company_id: string;
  branch_name: string | null;
  branch_contact_person_name: string | null;
  branch_contact_person_email: string | null;
  branch_contact_person_phone: string | null;
  branch_contact_person_designation: string | null;
};

/** Body for POST /api/v1/company-branch/register-branch */
export type CompanyBranchCreatePayload = {
  company_id: string;
  branch_name: string;
  branch_contact_person_name: string;
  branch_contact_person_email: string;
  branch_contact_person_phone: string;
  branch_contact_person_designation: string;
};

/** Country from GET /api/v1/address/countries */
export type Country = {
  id: number;
  country_name: string;
};

/** State from GET /api/v1/address/countries/{id}/states */
export type State = {
  id: number;
  state_name: string;
  country_id: number;
};

/**
 * Address from fast-api-backend (AddressResponse).
 * Backend uses snake_case; note `lattitude` spelling in the API.
 */
export type CompanyAddress = {
  id: string;
  country_id?: number;
  state_id?: number;
  city?: string;
  area?: string;
  landmark?: string | null;
  postal_code?: string;
  lattitude?: string | null;
  longitude?: string | null;
};

/** Body for POST /api/v1/address/branches/{branch_id}/addresses */
export type CompanyAddressCreatePayload = {
  country_id: number;
  state_id: number;
  city: string;
  area: string;
  landmark?: string | null;
  postal_code: string;
  lattitude?: string | null;
  longitude?: string | null;
};

/** Paginated list envelope from api_back. */
export type PaginatedApiResponse<T> = {
  code?: number;
  message?: string | null;
  data?: T;
  meta?: {
    pagination?: {
      page?: number;
      pages?: number;
      size?: number;
      total?: number;
    };
  };
};

/** Camera type enum from the Camera table schema */
export type CameraType = 'RTSP' | 'USB' | 'MIPI';

/** Camera status enum from the Camera table schema */
export type CameraStatus = 'online' | 'offline' | 'disconnected';

/**
 * Camera shape from the Camera table schema.
 * Matches: camera name, device/company FKs, type, rtsp url, status,
 * location/zone/department/group, resolution, fps, audit fields.
 */
export type Camera = Entity<{
  cameraName: string;
  deviceId: string;
  companyId: string;
  cameraType: CameraType;
  rtspUrl?: string | null;
  cameraStatus: CameraStatus;
  location?: string | null;
  zone?: string | null;
  department?: string | null;
  cameraGroup?: string | null;
  resolution?: string | null;
  fpsLimit?: number | null;
  updatedAt?: number | string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  isSystemRecord?: boolean;
  isDeleted?: boolean;
}>;
