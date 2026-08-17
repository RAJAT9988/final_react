/**
 * Branches for device reassignment — GET /v1/companies/{company_id}/branches
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type DeviceBranchOption = {
  branchId: string;
  branchName: string;
};

type BranchDto = {
  branch_id: string;
  branch_name: string;
};

export const getDeviceBranches = async (
  companyId: string,
): Promise<DeviceBranchOption[]> => {
  const response = await api.get<never, BranchDto[] | { data?: BranchDto[] }>(
    `/v1/companies/${companyId}/branches`,
  );

  const list = Array.isArray(response) ? response : response.data ?? [];
  return list.map((branch) => ({
    branchId: String(branch.branch_id),
    branchName: branch.branch_name,
  }));
};

export const getDeviceBranchesQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: ['devices', 'branches', companyId],
    queryFn: () => getDeviceBranches(companyId),
    enabled: Boolean(companyId),
  });

type UseDeviceBranchesOptions = {
  companyId: string;
  queryConfig?: QueryConfig<typeof getDeviceBranchesQueryOptions>;
};

export const useDeviceBranches = ({
  companyId,
  queryConfig,
}: UseDeviceBranchesOptions) => {
  return useQuery({
    ...getDeviceBranchesQueryOptions(companyId),
    ...queryConfig,
  });
};
