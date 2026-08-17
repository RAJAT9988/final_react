/**
 * Setup config — shared data + helpers for the whole setup wizard.
 *
 * Storage key in the browser: "bp-setup"
 */

import { paths } from '@/config/paths';

// --- Wizard step list (used by SetupStepper) ---
export const SETUP_STEPS = [
  { step: 1, key: 'device', label: 'Device', path: '/setup/device' },
  {
    step: 2,
    key: 'company',
    label: 'Company',
    path: '/setup/company',
  },
  {
    step: 3,
    key: 'company-branch',
    label: 'Branch',
    path: '/setup/company-branch',
  },
  {
    step: 4,
    key: 'company-address',
    label: 'Address',
    path: '/setup/company-address',
  },
  {
    step: 5,
    key: 'user',
    label: 'User',
    path: '/setup/user',
  },
  { step: 6, key: 'login', label: 'Login', path: '/setup/login' },
] as const;

// Allowed step numbers: 1 | 2 | 3 | 4 | 5 | 6
export type SetupStepNumber = (typeof SETUP_STEPS)[number]['step'];

// Device role chosen on Master / Slave page
export type DeviceRole = 'master' | 'slave';

/** Device role on Device Registration (matches Device table enum). */
export type DeviceRegistrationRole = 'standalone' | 'master' | 'slave';

/** Device status on Device Registration (matches Device table enum). */
export type DeviceStatus = 'Active' | 'Inactive' | 'Maintenance' | 'offline';

/** Company fields saved in step 2. */
export type CompanyRegistration = {
  companyId: string;
  companyName: string;
  companyDescription: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonMobile: string;
};

/** Branch fields saved in step 3. */
export type CompanyBranchRegistration = {
  branchId: string;
  companyId: string;
  branchName: string;
};

/** Address fields saved in step 4 (Address table — form fields only). */
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

/** Device fields saved in step 1 (Device table — form fields only). */
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

/** User fields saved in step 5. */
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
const SETUP_PROGRESS_KEY = 'bp-setup-progress';

/** Tracks which wizard steps were completed in order (not just stale IDs). */
export type SetupProgressKey =
  | 'device'
  | 'company'
  | 'branch'
  | 'address'
  | 'user';

export type SetupProgress = Partial<Record<SetupProgressKey, boolean>>;

const SETUP_STEP_ORDER: SetupProgressKey[] = [
  'device',
  'company',
  'branch',
  'address',
  'user',
];

const SETUP_STEP_PATHS: Record<SetupProgressKey, string> = {
  device: paths.setup.device.getHref(),
  company: paths.setup.company.getHref(),
  branch: paths.setup.companyBranch.getHref(),
  address: paths.setup.companyAddress.getHref(),
  user: paths.setup.user.getHref(),
};

const SETUP_STEP_REQUIREMENTS: Record<SetupStepNumber, SetupProgressKey[]> = {
  1: [],
  2: ['device'],
  3: ['device', 'company'],
  4: ['device', 'company', 'branch'],
  5: ['device', 'company', 'branch', 'address'],
  6: ['device', 'company', 'branch', 'address', 'user'],
};

const SETUP_STEP_DATA_KEYS: Record<
  SetupProgressKey,
  keyof Pick<
    SetupState,
    'device' | 'company' | 'companyBranch' | 'companyAddress' | 'user'
  >
> = {
  device: 'device',
  company: 'company',
  branch: 'companyBranch',
  address: 'companyAddress',
  user: 'user',
};

const hasStepData = (state: SetupState, step: SetupProgressKey): boolean => {
  switch (step) {
    case 'device':
      return Boolean(state.device?.deviceId?.trim());
    case 'company':
      return Boolean(state.company?.companyId?.trim());
    case 'branch':
      return Boolean(state.companyBranch?.branchId?.trim());
    case 'address':
      return Boolean(state.companyAddress?.addressId?.trim());
    case 'user':
      return Boolean(state.user?.userId?.trim());
    default:
      return false;
  }
};

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

/** Session-only progress — typing a URL in a new tab cannot reuse old wizard state. */
export const readSetupProgress = (): SetupProgress => {
  try {
    const raw = sessionStorage.getItem(SETUP_PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SetupProgress;
  } catch {
    return {};
  }
};

const writeSetupProgress = (progress: SetupProgress) => {
  sessionStorage.setItem(SETUP_PROGRESS_KEY, JSON.stringify(progress));
};

/** First setup step the user must complete before accessing `targetStep`. */
export const getSetupStepRedirect = (
  targetStep: SetupStepNumber,
): string | null => {
  const state = readSetupState();
  const progress = readSetupProgress();

  for (const key of SETUP_STEP_REQUIREMENTS[targetStep]) {
    if (!progress[key] || !hasStepData(state, key)) {
      return SETUP_STEP_PATHS[key];
    }
  }

  return null;
};

/** Mark a step complete and clear any later step data/progress. */
export const completeSetupStep = (
  step: SetupProgressKey,
  patch: Partial<SetupState> = {},
) => {
  const current = readSetupState();
  const stepIndex = SETUP_STEP_ORDER.indexOf(step);
  const progress: SetupProgress = {};

  for (let i = 0; i <= stepIndex; i++) {
    progress[SETUP_STEP_ORDER[i]] = true;
  }

  const next: SetupState = {
    ...current,
    ...patch,
  };

  for (let i = stepIndex + 1; i < SETUP_STEP_ORDER.length; i++) {
    delete next[SETUP_STEP_DATA_KEYS[SETUP_STEP_ORDER[i]]];
  }

  localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(next));
  writeSetupProgress(progress);
  return next;
};

export const readSetupState = (): SetupState => {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SetupState & { progress?: SetupProgress };
    // Legacy progress lived in localStorage — guards now use sessionStorage only.
    delete parsed.progress;
    return parsed;
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
  sessionStorage.removeItem(SETUP_PROGRESS_KEY);
};
