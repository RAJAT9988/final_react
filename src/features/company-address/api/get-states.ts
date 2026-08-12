/**
 * States list API — GET /api/v1/address/countries/{countryId}/states
 *
 * Loads states for the selected country (State dropdown).
 * Does not call the API until a valid country id is chosen.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { ApiResponse, State } from '@/types/api';

// ========== 1) MAIN API CALL ==========
// Get states for one country from backend
export const getStatesByCountry = async (
  countryId: number,
): Promise<State[]> => {
  // THIS LINE talks to the backend:
  // GET {API_URL}/api/v1/address/countries/{countryId}/states
  const response = await api.get<unknown, ApiResponse<State[]>>(
    `/api/v1/address/countries/${countryId}/states`,
  );

  // Return the list inside `data`, or [] if missing
  return response.data ?? [];
};

// ========== 2) QUERY OPTIONS ==========
// Cache per country. enabled=false until countryId is a real number
export const getStatesQueryOptions = (countryId: number) =>
  queryOptions({
    queryKey: ['states', countryId],
    queryFn: () => getStatesByCountry(countryId),
    // Do not call API when no country is selected yet
    enabled: Number.isInteger(countryId) && countryId > 0,
  });

// ========== 3) REACT QUERY HOOK ==========
// Lets CompanyAddressForm call: useStatesByCountry({ countryId })
type UseStatesOptions = {
  countryId: number;
  queryConfig?: QueryConfig<typeof getStatesQueryOptions>;
};

export const useStatesByCountry = ({
  countryId,
  queryConfig,
}: UseStatesOptions) => {
  return useQuery({
    ...getStatesQueryOptions(countryId),
    ...queryConfig,
  });
};
