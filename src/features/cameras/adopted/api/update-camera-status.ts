/**
 * Update camera status — PATCH /v1/cameras/{id}/status
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseCameraResponse } from '@/features/cameras/adopted/api/get-adopted-cameras';
import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { CameraDto } from '@/types/api';

export type UpdateCameraStatusInput = {
  cameraId: string;
  cameraStatus: 'online' | 'offline' | 'disconnected';
};

export const updateCameraStatus = async ({
  cameraId,
  cameraStatus,
}: UpdateCameraStatusInput): Promise<AdoptedCamera> => {
  const camera = await api.patch<
    { camera_status: string },
    CameraDto | { data?: CameraDto }
  >(`/v1/cameras/${cameraId}/status`, { camera_status: cameraStatus });

  return parseCameraResponse(camera);
};

type UseUpdateCameraStatusOptions = {
  mutationConfig?: MutationConfig<typeof updateCameraStatus>;
};

export const useUpdateCameraStatus = ({
  mutationConfig,
}: UseUpdateCameraStatusOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: updateCameraStatus,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['cameras'] });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
