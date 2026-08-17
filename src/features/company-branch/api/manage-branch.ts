import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { CompanyBranch } from '@/types/api';

export const getBranches = async (
  companyId: string,
): Promise<CompanyBranch[]> => {
  const response = await api.get<
    never,
    CompanyBranch[] | { data?: CompanyBranch[] }
  >(`/v1/companies/${companyId}/branches`);
  return Array.isArray(response) ? response : response.data ?? [];
};

export const getBranch = async (branchId: string): Promise<CompanyBranch> => {
  return api.get(`/v1/branches/${branchId}`);
};

export const updateBranch = async ({
  branchId,
  data,
}: {
  branchId: string;
  data: {
    branch_name?: string;
    branch_contact_person_name?: string;
    branch_contact_person_email?: string;
    branch_contact_person_mobile_no?: string;
    branch_contact_person_designation?: string;
  };
}): Promise<CompanyBranch> => {
  return api.patch(`/v1/branches/${branchId}`, data);
};

export const deleteBranch = async (branchId: string): Promise<void> => {
  await api.delete(`/v1/branches/${branchId}`);
};

export const useBranches = (companyId: string) =>
  useQuery(
    queryOptions({
      queryKey: ['branches', companyId],
      queryFn: () => getBranches(companyId),
      enabled: Boolean(companyId),
    }),
  );

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBranch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};
