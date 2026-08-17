/**
 * Countries list API — GET /v1/countries
 *
 * Loads countries for the Country dropdown on the address form.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Country } from '@/types/api';

export const getCountries = async (): Promise<Country[]> => {
  const response = await api.get<unknown, Country[] | { data?: Country[] }>(
    '/v1/countries',
  );

  return Array.isArray(response) ? response : (response.data ?? []);
};

export const getCountriesQueryOptions = () =>
  queryOptions({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 0,
  });

type UseCountriesOptions = {
  queryConfig?: QueryConfig<typeof getCountriesQueryOptions>;
};

export const useCountries = ({ queryConfig }: UseCountriesOptions = {}) => {
  return useQuery({
    ...getCountriesQueryOptions(),
    ...queryConfig,
  });
};
