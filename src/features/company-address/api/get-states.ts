/**
 * States list API — GET /v1/countries/{countryId}/states
 *
 * Loads states for the selected country. Waits until a country UUID is chosen.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { State } from '@/types/api';

export const getStatesByCountry = async (
  countryId: string,
): Promise<State[]> => {
  const response = await api.get<unknown, State[] | { data?: State[] }>(
    `/v1/countries/${countryId}/states`,
  );

  return Array.isArray(response) ? response : (response.data ?? []);
};

export const getStatesQueryOptions = (countryId: string) =>
  queryOptions({
    queryKey: ['states', countryId],
    queryFn: () => getStatesByCountry(countryId),
    enabled: countryId.trim().length > 0,
  });

type UseStatesOptions = {
  countryId: string;
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
