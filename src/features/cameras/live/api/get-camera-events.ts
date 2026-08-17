import { queryOptions, useQuery } from '@tanstack/react-query';

import { QueryConfig } from '@/lib/react-query';

export type CameraLiveEvent = {
  id: string;
  cameraId: string;
  cameraName: string;
  time: string;
  label: string;
  kind: 'Motion' | 'Person' | 'Doorbell';
};

/** FastAPI has no camera events endpoint yet. */
export const getCameraEvents = async (
  cameraId: string,
): Promise<CameraLiveEvent[]> => {
  void cameraId;
  return [];
};

export const getCameraEventsQueryOptions = (cameraId: string) =>
  queryOptions({
    queryKey: ['cameras', 'events', cameraId],
    queryFn: () => getCameraEvents(cameraId),
    enabled: Boolean(cameraId),
  });

type UseCameraEventsOptions = {
  cameraId: string;
  queryConfig?: QueryConfig<typeof getCameraEventsQueryOptions>;
};

export const useCameraEvents = ({
  cameraId,
  queryConfig,
}: UseCameraEventsOptions) => {
  return useQuery({
    ...getCameraEventsQueryOptions(cameraId),
    ...queryConfig,
  });
};
