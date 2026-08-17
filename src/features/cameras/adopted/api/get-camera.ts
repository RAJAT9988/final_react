/**
 * One camera — GET /v1/cameras/{id}
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import {
  parseCameraResponse,
} from '@/features/cameras/adopted/api/get-adopted-cameras';
import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { CameraDto } from '@/types/api';

export const getCamera = async (cameraId: string): Promise<AdoptedCamera> => {
  const response = await api.get<unknown, CameraDto | { data?: CameraDto }>(
    `/v1/cameras/${cameraId}`,
  );

  return parseCameraResponse(response);
};

export const getCameraQueryOptions = (cameraId: string) =>
  queryOptions({
    queryKey: ['cameras', 'adopted', cameraId],
    queryFn: () => getCamera(cameraId),
    enabled: Boolean(cameraId),
  });

type UseCameraOptions = {
  cameraId: string;
  queryConfig?: QueryConfig<typeof getCameraQueryOptions>;
};

export const useCamera = ({ cameraId, queryConfig }: UseCameraOptions) => {
  return useQuery({
    ...getCameraQueryOptions(cameraId),
    ...queryConfig,
  });
};
