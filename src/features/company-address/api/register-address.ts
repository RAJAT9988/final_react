/**
 * Address registration API — POST /v1/addresses
 *
 * Needs branchId from the branch step → returns AddressDTO (address_id).
 */

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import {
  CompanyAddress,
  CompanyAddressCreatePayload,
} from '@/types/api';

export type RegisterAddressInput = {
  branchId: string;
  countryId: string;
  stateId: string;
  city: string;
  area: string;
  locality?: string;
  landmark?: string;
  street?: string;
  postalCode: string;
  latitude?: string;
  longitude?: string;
};

const toOptionalFloat = (value?: string): number | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const toCreatePayload = (
  data: RegisterAddressInput,
): CompanyAddressCreatePayload => ({
  branch_id: data.branchId,
  country_id: data.countryId,
  state_id: data.stateId,
  city: data.city,
  area: data.area,
  locality: data.locality?.trim() ? data.locality.trim() : null,
  landmark: data.landmark?.trim() ? data.landmark.trim() : null,
  street: data.street?.trim() ? data.street.trim() : null,
  postal_code: data.postalCode,
  latitude: toOptionalFloat(data.latitude),
  longitude: toOptionalFloat(data.longitude),
});

export const registerAddress = async (
  data: RegisterAddressInput,
): Promise<CompanyAddress> => {
  const address = await api.post<
    CompanyAddressCreatePayload,
    CompanyAddress
  >('/v1/addresses', toCreatePayload(data));

  if (!address.address_id) {
    throw new Error('Address registration failed');
  }

  return address;
};

type UseRegisterAddressOptions = {
  mutationConfig?: MutationConfig<typeof registerAddress>;
};

export const useRegisterAddress = ({
  mutationConfig,
}: UseRegisterAddressOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: registerAddress,
  });
};
