/**
 * Setup config — shared data + helpers for the whole setup wizard.
 *
 * Storage key in the browser: "bp-setup"
 */

// --- Wizard step list (used by SetupStepper) ---
export const SETUP_STEPS = [
  { step: 1, key: 'login', label: 'Login', path: '/setup/login' },
  {
    step: 2,
    key: 'master-slave',
    label: 'Master / Slave',
    path: '/setup/master-slave',
  },
  {
    step: 3,
    key: 'company',
    label: 'Company',
    path: '/setup/company',
  },
  {
    step: 4,
    key: 'company-branch',
    label: 'Branch',
    path: '/setup/company-branch',
  },
  {
    step: 5,
    key: 'company-address',
    label: 'Address',
    path: '/setup/company-address',
  },
  {
    step: 6,
    key: 'device',
    label: 'Device',
    path: '/setup/device',
  },
  {
    step: 7,
    key: 'user',
    label: 'User',
    path: '/setup/user',
  },
] as const;

// Allowed step numbers: 1 | 2 | 3 | 4 | 5 | 6 | 7
export type SetupStepNumber = (typeof SETUP_STEPS)[number]['step'];

// Device role chosen on Master / Slave page
export type DeviceRole = 'master' | 'slave';

/** Device role on Device Registration (matches Device table enum). */
export type DeviceRegistrationRole = 'standalone' | 'master' | 'slave';

/** Device status on Device Registration (matches Device table enum). */
export type DeviceStatus = 'Active' | 'Inactive' | 'Maintenance' | 'offline';

/** Company fields saved in step 3. */
export type CompanyRegistration = {
  companyId: string;
  companyName: string;
  companyDescription: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonMobile: string;
};

/** Branch fields saved in step 4. */
export type CompanyBranchRegistration = {
  branchId: string;
  companyId: string;
  branchName: string;
};

/** Address fields saved in step 5 (Address table — form fields only). */
export type CompanyAddressRegistration = {
  addressId: string;
  companyId: string;
  branchId: string;
  countryId: string;
  stateId: string;
  city: string;
  area: string;
  locality: string;
  landmark: string;
  street: string;
  postalCode: string;
  latitude: string;
  longitude: string;
};

/** Device fields saved in step 6 (Device table — form fields only). */
export type DeviceRegistration = {
  deviceId: string;
  companyId: string;
  branchId: string;
  deviceName: string;
  ip: string;
  deviceRole: DeviceRegistrationRole;
  status: DeviceStatus;
  serialNo: string;
  macId: string;
  manufacturingDate: string;
};

/** User fields saved in step 7. */
export type UserRegistration = {
  userId: string;
  roleId: string;
  companyId: string;
  name: string;
  email: string;
  password: string;
};

export const SETUP_ROLES = [
  { roleId: 'role_owner', label: 'Owner' },
  { roleId: 'role_admin', label: 'Admin' },
  { roleId: 'role_operator', label: 'Operator' },
  { roleId: 'role_viewer', label: 'Viewer' },
] as const;

export const DEVICE_ROLES = [
  { value: 'standalone', label: 'Standalone' },
  { value: 'master', label: 'Master' },
  { value: 'slave', label: 'Slave' },
] as const;

export const DEVICE_STATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'offline', label: 'Offline' },
] as const;

export const createCompanyId = () =>
  `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createBranchId = () =>
  `br_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createAddressId = () =>
  `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createDeviceId = () =>
  `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createUserId = () =>
  `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const SETUP_STORAGE_KEY = 'bp-setup';

type SetupState = {
  loggedIn?: boolean;
  email?: string;
  role?: DeviceRole;
  company?: CompanyRegistration;
  companyBranch?: CompanyBranchRegistration;
  companyAddress?: CompanyAddressRegistration;
  device?: DeviceRegistration;
  user?: UserRegistration;
};

export const readSetupState = (): SetupState => {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SetupState;
  } catch {
    return {};
  }
};

export const writeSetupState = (patch: Partial<SetupState>) => {
  const next = { ...readSetupState(), ...patch };
  localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearSetupState = () => {
  localStorage.removeItem(SETUP_STORAGE_KEY);
};
