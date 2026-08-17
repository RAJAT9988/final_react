import { queryOptions, useQuery } from '@tanstack/react-query';

import { QueryConfig } from '@/lib/react-query';

export type HomeEvent = {
  id: string;
  cameraId: string;
  cameraName: string;
  time: string;
  label: string;
  kind: 'Motion' | 'Person' | 'Doorbell';
};

/** FastAPI has no events endpoint yet. */
export const getRecentEvents = async (): Promise<HomeEvent[]> => {
  return [];
};

export const getRecentEventsQueryOptions = () =>
  queryOptions({
    queryKey: ['home', 'events'],
    queryFn: getRecentEvents,
  });

type UseRecentEventsOptions = {
  queryConfig?: QueryConfig<typeof getRecentEventsQueryOptions>;
};

export const useRecentEvents = ({
  queryConfig,
}: UseRecentEventsOptions = {}) => {
  return useQuery({
    ...getRecentEventsQueryOptions(),
    ...queryConfig,
  });
};
