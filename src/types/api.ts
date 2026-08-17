/**
 * Shared API types used by auth and the rest of the app.
 *
 * Setup wizard talks to fast-api_backend-main:
 *   POST /v1/companies, /v1/companies/{id}/branches, /v1/addresses
 *   GET  /v1/countries, /v1/countries/{id}/states
 *   POST /v1/auth/register, /v1/auth/login
 *   GET  /v1/profile
 *
 * Cameras tab:
 *   GET/POST /v1/cameras, GET/PATCH/DELETE /v1/cameras/{id}
 *   PATCH /v1/cameras/{id}/status
 *
 * Devices tab:
 *   GET/POST /v1/devices, GET/PATCH/DELETE /v1/devices/{id}
 *   GET /v1/devices/{id}/health/latest
 */

/** Standard envelope used by some device/camera mocks. */
export type ApiResponse<T> = {
  code: number;
  message: string | null;
  data?: T;
};

/** Fields every saved record usually has. */
export type BaseEntity = {
  id: string;
  createdAt: number | string;
};

/** Helper: take shape T and add id + createdAt. */
export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

/**
 * User from GET /v1/profile (UserDTO).
 * `id` is a copy of `user_id` for older UI that still reads `id`.
 */
export type User = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role_id: number;
  company_id: string;
  status: string;
  mfa_enabled: boolean;
  role_name?: string | null;
  is_deleted?: boolean;
  firstName?: string;
  lastName?: string | null;
  username?: string | null;
  createdAt?: number | string;
  updatedAt?: number | string | null;
};

/** POST /v1/auth/login — LoginResponse after a successful (non-MFA) login. */
export type LoginTokenData = {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  mfa_required: boolean;
  challenge_token: string | null;
};

/** Login result used by react-query-auth loginFn. */
export type AuthResponse = {
  jwt: string;
  user: User;
};

/** POST /v1/companies — CompanyDTO (no envelope). */
export type Company = {
  company_id: string;
  company_name: string;
  contact_person_name?: string | null;
  contact_person_email?: string | null;
  contact_person_mobile_no?: string | null;
  contact_person_designation?: string | null;
  company_description?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Body for POST /v1/companies */
export type CompanyCreatePayload = {
  company_name: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_mobile_no?: string;
  contact_person_designation?: string;
  company_description?: string;
};

/** POST /v1/companies/{company_id}/branches — CompanyBranchDTO */
export type CompanyBranch = {
  branch_id: string;
  company_id: string;
  branch_name: string;
  branch_contact_person_name?: string | null;
  branch_contact_person_email?: string | null;
  branch_contact_person_mobile_no?: string | null;
  branch_contact_person_designation?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Body for POST /v1/companies/{company_id}/branches */
export type CompanyBranchCreatePayload = {
  company_id: string;
  branch_name: string;
  branch_contact_person_name?: string;
  branch_contact_person_email?: string;
  branch_contact_person_mobile_no?: string;
  branch_contact_person_designation?: string;
};

/** GET /v1/countries — CountryDTO */
export type Country = {
  country_id: string;
  country_name: string;
  created_at?: string;
  updated_at?: string;
};

/** GET /v1/countries/{id}/states — StateDTO */
export type State = {
  state_id: string;
  state_name: string;
  country_id: string;
  created_at?: string;
  updated_at?: string;
};

/** POST /v1/addresses — AddressDTO */
export type CompanyAddress = {
  address_id: string;
  country_id: string;
  state_id: string;
  city: string;
  area?: string | null;
  locality?: string | null;
  landmark?: string | null;
  street?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  branch_id?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Body for POST /v1/addresses */
export type CompanyAddressCreatePayload = {
  country_id: string;
  state_id: string;
  city: string;
  area?: string | null;
  locality?: string | null;
  landmark?: string | null;
  street?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  branch_id?: string | null;
};

/** Paginated list envelope from older mocks. */
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

/** GET/POST /v1/cameras — CameraDTO */
export type CameraDto = {
  camera_id: string;
  camera_name: string;
  company_device_id: string;
  camera_type: string;
  rtsp_url?: string | null;
  camera_status: string;
  location?: string | null;
  zone?: string | null;
  department?: string | null;
  camera_group?: string | null;
  resolution?: string | null;
  fps_limit?: number | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

/** Body for POST /v1/cameras */
export type CameraCreatePayload = {
  camera_name: string;
  company_device_id: string;
  camera_type: string;
  rtsp_url?: string | null;
  camera_status?: string;
  location?: string | null;
  zone?: string | null;
  department?: string | null;
  camera_group?: string | null;
  resolution?: string | null;
  fps_limit?: number | null;
};

/** Body for PATCH /v1/cameras/{id} */
export type CameraUpdatePayload = {
  camera_name?: string;
  camera_type?: string;
  rtsp_url?: string | null;
  location?: string | null;
  zone?: string | null;
  department?: string | null;
  camera_group?: string | null;
  resolution?: string | null;
  fps_limit?: number | null;
};

/** Nested assignment on DeviceDTO */
export type CompanyDeviceAssignmentDto = {
  company_device_id: string;
  device_id: string;
  company_id?: string | null;
  branch_id?: string | null;
  approval_status?: string;
  approved_by?: string | null;
  approved_at?: string | null;
};

/** GET /v1/devices — DeviceDTO */
export type DeviceDto = {
  device_id: string;
  device_name: string;
  ip: string;
  dns_name?: string | null;
  device_role?: string;
  status?: string;
  serial_no: string;
  mac_id: string;
  manufacturing_date?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  current_assignment?: CompanyDeviceAssignmentDto | null;
};

/** Body for POST /v1/devices */
export type DeviceCreatePayload = {
  device_name: string;
  ip: string;
  dns_name?: string | null;
  serial_no: string;
  mac_id: string;
  manufacturing_date?: string | null;
  branch_id: string;
};

/** Body for PATCH /v1/devices/{id} */
export type DeviceUpdatePayload = {
  device_name?: string;
  ip?: string;
  dns_name?: string | null;
  device_role?: string;
  status?: string;
  manufacturing_date?: string | null;
};

/** GET /v1/devices/{id}/health/latest */
export type DeviceHealthDto = {
  device_health_id: string;
  company_device_id: string;
  cpu_usage: number;
  npu_usage: number;
  ram: number;
  temperature: number;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DeviceHealthCreatePayload = {
  cpu_usage: number;
  npu_usage: number;
  ram: number;
  temperature: number;
};

export type DeviceModelSubscriptionDto = {
  subscription_id: string;
  company_device_id: string;
  model_id: string;
  is_enabled: boolean;
  enabled_by?: string | null;
  start_date: string;
  end_date?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DeviceModelSubscriptionCreatePayload = {
  model_id: string;
  subscription_key: string;
  is_enabled?: boolean;
  start_date: string;
  end_date?: string | null;
};

export type DeviceCameraAssignmentDto = {
  model_assign_id: string;
  camera_id: string;
  company_device_id: string;
  confidence_threshold: number;
  status: string;
  start_date: string;
  end_date?: string | null;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DeviceCameraAssignmentCreatePayload = {
  camera_id: string;
  confidence_threshold: number;
  status?: string;
  start_date: string;
  end_date?: string | null;
};

export type RoleDto = {
  role_id: number;
  role_name: string;
};

export type PermissionDto = {
  permission_id: number;
  name: string;
  module: string;
  action: string;
  description?: string | null;
  is_allowed?: boolean | null;
};

export type RoleWithPermissionsDto = RoleDto & {
  permissions: PermissionDto[];
};
