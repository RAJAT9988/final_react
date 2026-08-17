/**
 * Company registration API — POST /v1/companies
 *
 * Takes form values → creates company → returns CompanyDTO (company_id).
 */

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { Company, CompanyCreatePayload } from '@/types/api';

export type RegisterCompanyInput = {
  companyName: string;
  companyDescription: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonMobile: string;
};

const toCreatePayload = (
  data: RegisterCompanyInput,
): CompanyCreatePayload => ({
  company_name: data.companyName,
  company_description: data.companyDescription,
  contact_person_name: data.contactPersonName,
  contact_person_designation: data.contactPersonDesignation,
  contact_person_email: data.contactPersonEmail,
  contact_person_mobile_no: data.contactPersonMobile,
});

export const registerCompany = async (
  data: RegisterCompanyInput,
): Promise<Company> => {
  const company = await api.post<CompanyCreatePayload, Company>(
    '/v1/companies',
    toCreatePayload(data),
  );

  if (!company.company_id) {
    throw new Error('Company registration failed');
  }

  return company;
};

type UseRegisterCompanyOptions = {
  mutationConfig?: MutationConfig<typeof registerCompany>;
};

export const useRegisterCompany = ({
  mutationConfig,
}: UseRegisterCompanyOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: registerCompany,
  });
};
