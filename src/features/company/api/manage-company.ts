import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { Company, CompanyCreatePayload } from '@/types/api';

export const getCompany = async (companyId: string): Promise<Company> => {
  const company = await api.get<never, Company>(`/v1/companies/${companyId}`);
  if (!company.company_id) throw new Error('Company not found');
  return company;
};

export const listCompanies = async (): Promise<Company[]> => {
  const response = await api.get<never, Company[] | { data?: Company[] }>(
    '/v1/companies',
  );
  return Array.isArray(response) ? response : response.data ?? [];
};

export const updateCompany = async ({
  companyId,
  data,
}: {
  companyId: string;
  data: Partial<CompanyCreatePayload>;
}): Promise<Company> => {
  return api.patch(`/v1/companies/${companyId}`, data);
};

export const deleteCompany = async (companyId: string): Promise<void> => {
  await api.delete(`/v1/companies/${companyId}`);
};

export const getCompanyQueryOptions = (companyId: string) =>
  queryOptions({
    queryKey: ['company', companyId],
    queryFn: () => getCompany(companyId),
    enabled: Boolean(companyId),
  });

export const useCompany = (companyId: string) =>
  useQuery(getCompanyQueryOptions(companyId));

export const useCompanies = () =>
  useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
  });

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['company', vars.companyId],
      });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
};
