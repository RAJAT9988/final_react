/**
 * Devices that can host cameras — GET /v1/devices
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { DeviceDto } from '@/types/api';

export type CameraDeviceOption = {
  deviceId: string;
  name: string;
  companyDeviceId: string;
};

const unwrapList = (response: DeviceDto[] | { data?: DeviceDto[] }): DeviceDto[] =>
  Array.isArray(response) ? response : (response.data ?? []);

export const getCameraDevices = async (): Promise<CameraDeviceOption[]> => {
  const response = await api.get<unknown, DeviceDto[] | { data?: DeviceDto[] }>(
    '/v1/devices',
  );

  return unwrapList(response)
    .filter((device) => device.current_assignment?.company_device_id)
    .map((device) => ({
      deviceId: String(device.device_id),
      name: device.device_name,
      companyDeviceId: String(device.current_assignment?.company_device_id),
    }));
};

export const getCameraDevicesQueryOptions = () =>
  queryOptions({
    queryKey: ['devices', 'for-cameras'],
    queryFn: getCameraDevices,
  });

type UseCameraDevicesOptions = {
  queryConfig?: QueryConfig<typeof getCameraDevicesQueryOptions>;
};

export const useCameraDevices = ({
  queryConfig,
}: UseCameraDevicesOptions = {}) => {
  return useQuery({
    ...getCameraDevicesQueryOptions(),
    ...queryConfig,
  });
};
