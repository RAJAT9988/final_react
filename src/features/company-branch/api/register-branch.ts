/**
 * Branch registration API — POST /v1/companies/{company_id}/branches
 *
 * Needs companyId from the company step → returns CompanyBranchDTO (branch_id).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { CompanyBranch, CompanyBranchCreatePayload } from '@/types/api';

export type RegisterBranchInput = {
  companyId: string;
  branchName: string;
  branchContactPersonName: string;
  branchContactPersonEmail: string;
  branchContactPersonPhone: string;
  branchContactPersonDesignation: string;
};

const toCreatePayload = (
  data: RegisterBranchInput,
): CompanyBranchCreatePayload => ({
  company_id: data.companyId,
  branch_name: data.branchName,
  branch_contact_person_name: data.branchContactPersonName,
  branch_contact_person_email: data.branchContactPersonEmail,
  branch_contact_person_mobile_no: data.branchContactPersonPhone,
  branch_contact_person_designation: data.branchContactPersonDesignation,
});

export const registerBranch = async (
  data: RegisterBranchInput,
): Promise<CompanyBranch> => {
  const branch = await api.post<CompanyBranchCreatePayload, CompanyBranch>(
    `/v1/companies/${data.companyId}/branches`,
    toCreatePayload(data),
  );

  if (!branch.branch_id) {
    throw new Error('Branch registration failed');
  }

  return branch;
};

type UseRegisterBranchOptions = {
  mutationConfig?: MutationConfig<typeof registerBranch>;
};

export const useRegisterBranch = ({
  mutationConfig,
}: UseRegisterBranchOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: registerBranch,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
