/**
 * Countries list API — GET /api/v1/address/countries
 *
 * Loads countries for the Country dropdown on the address form.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Country, PaginatedApiResponse } from '@/types/api';

// ========== 1) MAIN API CALL ==========
// Get the country list from backend
export const getCountries = async (): Promise<Country[]> => {
  // THIS LINE talks to the backend:
  // GET {API_URL}/api/v1/address/countries
  const response = await api.get<
    unknown,
    PaginatedApiResponse<Country[]>
  >('/api/v1/address/countries');

  // Return the list inside `data`, or [] if missing
  return response.data ?? [];
};

// ========== 2) QUERY OPTIONS ==========
// Cache key so React Query does not refetch every time
export const getCountriesQueryOptions = () =>
  queryOptions({
    queryKey: ['countries'],
    queryFn: getCountries,
  });

// ========== 3) REACT QUERY HOOK ==========
// Lets CompanyAddressForm call: useCountries()
type UseCountriesOptions = {
  queryConfig?: QueryConfig<typeof getCountriesQueryOptions>;
};

export const useCountries = ({ queryConfig }: UseCountriesOptions = {}) => {
  return useQuery({
    ...getCountriesQueryOptions(),
    ...queryConfig,
  });
};
