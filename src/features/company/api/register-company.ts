/**
 * Company registration API — POST /api/v1/company/register-company
 *
 * Takes form values → sends to backend → returns created company (with id).
 * That company id is saved in setup state for the branch step.
 */

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { ApiResponse, Company, CompanyCreatePayload } from '@/types/api';

// ========== 1) FORM INPUT SHAPE ==========
// What the company form sends (camelCase names)
export type RegisterCompanyInput = {
  companyName: string;
  companyDescription: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonMobile: string;
};

// ========== 2) MAP FORM → BACKEND BODY ==========
// Backend wants snake_case field names
const toCreatePayload = (
  data: RegisterCompanyInput,
): CompanyCreatePayload => ({
  company_name: data.companyName,
  company_description: data.companyDescription,
  contact_person_name: data.contactPersonName,
  contact_person_designation: data.contactPersonDesignation,
  contact_person_email: data.contactPersonEmail,
  // Form says "mobile", backend says "phone"
  contact_person_phone: data.contactPersonMobile,
});

// ========== 3) MAIN API CALL ==========
// Create company on backend and return it (includes company id)
export const registerCompany = async (
  data: RegisterCompanyInput,
): Promise<Company> => {
  // THIS LINE talks to the backend:
  // POST {API_URL}/api/v1/company/register-company
  const response = await api.post<
    CompanyCreatePayload,
    ApiResponse<Company>
  >('/api/v1/company/register-company', toCreatePayload(data));

  // Backend must return data.id (the new company id — a UUID)
  if (!response.data?.id) {
    throw new Error(response.message || 'Company registration failed');
  }

  // Give company object back (id is inside: response.data.id)
  return response.data;
};

// ========== 4) REACT QUERY HOOK ==========
// Lets CompanyForm call: registerCompany.mutate(values)
type UseRegisterCompanyOptions = {
  mutationConfig?: MutationConfig<typeof registerCompany>;
};

export const useRegisterCompany = ({
  mutationConfig,
}: UseRegisterCompanyOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    // When mutate() runs, call registerCompany above
    mutationFn: registerCompany,
  });
};
