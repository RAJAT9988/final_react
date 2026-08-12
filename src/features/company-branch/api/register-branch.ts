/**
 * Branch registration API — POST /api/v1/company-branch/register-branch
 *
 * Needs companyId from company step → creates branch → returns branch (with id).
 * That branch id is saved in setup state for the address step.
 */

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import {
  ApiResponse,
  CompanyBranch,
  CompanyBranchCreatePayload,
} from '@/types/api';

// ========== 1) FORM INPUT SHAPE ==========
// companyId is a UUID string from setup state (saved after company registration)
export type RegisterBranchInput = {
  companyId: string;
  branchName: string;
  branchContactPersonName: string;
  branchContactPersonEmail: string;
  branchContactPersonPhone: string;
  branchContactPersonDesignation: string;
};

// ========== 2) MAP FORM → BACKEND BODY ==========
// Backend wants snake_case field names
const toCreatePayload = (
  data: RegisterBranchInput,
): CompanyBranchCreatePayload => ({
  company_id: data.companyId,
  branch_name: data.branchName,
  branch_contact_person_name: data.branchContactPersonName,
  branch_contact_person_email: data.branchContactPersonEmail,
  branch_contact_person_phone: data.branchContactPersonPhone,
  branch_contact_person_designation: data.branchContactPersonDesignation,
});

// ========== 3) MAIN API CALL ==========
// Create branch on backend and return it (includes branch id)
export const registerBranch = async (
  data: RegisterBranchInput,
): Promise<CompanyBranch> => {
  // THIS LINE talks to the backend:
  // POST {API_URL}/api/v1/company-branch/register-branch
  const response = await api.post<
    CompanyBranchCreatePayload,
    ApiResponse<CompanyBranch>
  >('/api/v1/company-branch/register-branch', toCreatePayload(data));

  // Backend must return data.id (the new branch id — a UUID)
  if (!response.data?.id) {
    throw new Error(response.message || 'Branch registration failed');
  }

  // Give branch object back (id is inside: response.data.id)
  return response.data;
};

// ========== 4) REACT QUERY HOOK ==========
// Lets CompanyBranchForm call: registerBranch.mutate(values)
type UseRegisterBranchOptions = {
  mutationConfig?: MutationConfig<typeof registerBranch>;
};

export const useRegisterBranch = ({
  mutationConfig,
}: UseRegisterBranchOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    // When mutate() runs, call registerBranch above
    mutationFn: registerBranch,
  });
};
