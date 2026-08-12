/**
 * Address registration API —
 * POST /api/v1/address/branches/{branchId}/addresses
 *
 * Needs branchId from branch step → creates address → returns address (with id).
 */

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import {
  ApiResponse,
  CompanyAddress,
  CompanyAddressCreatePayload,
} from '@/types/api';

// ========== 1) FORM INPUT SHAPE ==========
// branchId is a UUID string from setup state (saved after branch registration)
export type RegisterAddressInput = {
  branchId: string;
  countryId: number;
  stateId: number;
  city: string;
  area: string;
  landmark?: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
};

// ========== 2) MAP FORM → BACKEND BODY ==========
// Backend wants snake_case field names
const toCreatePayload = (
  data: RegisterAddressInput,
): CompanyAddressCreatePayload => ({
  country_id: data.countryId,
  state_id: data.stateId,
  city: data.city,
  area: data.area,
  // If empty / only spaces, send '' so backend still gets a string
  landmark: data.landmark?.trim() ? data.landmark.trim() : '',
  postal_code: data.postalCode,
  // Backend field is spelled `lattitude` (keep that spelling)
  lattitude: data.latitude?.trim() ? data.latitude.trim() : '',
  longitude: data.longitude?.trim() ? data.longitude.trim() : '',
});

// ========== 3) MAIN API CALL ==========
// Create address on backend and return it (includes address id)
export const registerAddress = async (
  data: RegisterAddressInput,
): Promise<CompanyAddress> => {
  // THIS LINE talks to the backend:
  // POST {API_URL}/api/v1/address/branches/{branchId}/addresses
  const response = await api.post<
    CompanyAddressCreatePayload,
    ApiResponse<CompanyAddress>
  >(
    `/api/v1/address/branches/${data.branchId}/addresses`,
    toCreatePayload(data),
  );

  // Backend must return data.id (the new address id — a UUID)
  if (!response.data?.id) {
    throw new Error(response.message || 'Address registration failed');
  }

  // Give address object back (id is inside: response.data.id)
  return response.data;
};

// ========== 4) REACT QUERY HOOK ==========
// Lets CompanyAddressForm call: registerAddress.mutate(values)
type UseRegisterAddressOptions = {
  mutationConfig?: MutationConfig<typeof registerAddress>;
};

export const useRegisterAddress = ({
  mutationConfig,
}: UseRegisterAddressOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    // When mutate() runs, call registerAddress above
    mutationFn: registerAddress,
  });
};
