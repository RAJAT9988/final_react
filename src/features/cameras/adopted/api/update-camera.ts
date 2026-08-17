/**
 * Update camera — PATCH /v1/cameras/{id}
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseCameraResponse } from '@/features/cameras/adopted/api/get-adopted-cameras';
import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { CameraDto, CameraUpdatePayload } from '@/types/api';

export type UpdateCameraInput = {
  cameraId: string;
  data: CameraUpdatePayload;
};

export const updateCamera = async ({
  cameraId,
  data,
}: UpdateCameraInput): Promise<AdoptedCamera> => {
  const camera = await api.patch<
    CameraUpdatePayload,
    CameraDto | { data?: CameraDto }
  >(`/v1/cameras/${cameraId}`, data);

  return parseCameraResponse(camera);
};

type UseUpdateCameraOptions = {
  mutationConfig?: MutationConfig<typeof updateCamera>;
};

export const useUpdateCamera = ({
  mutationConfig,
}: UseUpdateCameraOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: updateCamera,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['cameras'] });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
