/**
 * Add camera — POST /v1/cameras
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AddCameraInput } from '@/features/cameras/add/components/add-camera-form';
import { parseCameraResponse } from '@/features/cameras/adopted/api/get-adopted-cameras';
import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { CameraCreatePayload, CameraDto } from '@/types/api';

const optionalText = (value?: string): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toCreatePayload = (data: AddCameraInput): CameraCreatePayload => {
  const liveSource =
    data.sources.find((source) => source.role !== 'snapshot' && source.url.trim()) ??
    data.sources.find((source) => source.url.trim());

  if (!data.companyDeviceId.trim()) {
    throw new Error('Select a device before adding a camera.');
  }

  return {
    camera_name: data.name.trim(),
    company_device_id: data.companyDeviceId.trim(),
    camera_type: 'RTSP',
    rtsp_url: liveSource?.url.trim() || null,
    camera_status: 'offline',
    location: data.location.trim(),
    zone: optionalText(data.zone),
    department: optionalText(data.department),
    camera_group: optionalText(data.cameraGroup),
  };
};

export const addCamera = async (
  data: AddCameraInput,
): Promise<AdoptedCamera> => {
  const camera = await api.post<
    CameraCreatePayload,
    CameraDto | { data?: CameraDto }
  >('/v1/cameras', toCreatePayload(data));

  return parseCameraResponse(camera);
};

type UseAddCameraOptions = {
  mutationConfig?: MutationConfig<typeof addCamera>;
};

export const useAddCamera = ({ mutationConfig }: UseAddCameraOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: addCamera,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['cameras'] });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
