/**
 * One device — GET /v1/devices/{id}
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import {
  mapDeviceDto,
  unwrapDevice,
} from '@/features/devices/adopted/api/get-adopted-devices';
import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { DeviceDto } from '@/types/api';

export const getDevice = async (deviceId: string): Promise<AdoptedDevice> => {
  const response = await api.get<unknown, DeviceDto | { data?: DeviceDto }>(
    `/v1/devices/${deviceId}`,
  );

  const dto = unwrapDevice(response);
  if (!dto?.device_id) {
    throw new Error('Device not found');
  }

  return mapDeviceDto(dto);
};

export const getDeviceQueryOptions = (deviceId: string) =>
  queryOptions({
    queryKey: ['devices', 'adopted', deviceId],
    queryFn: () => getDevice(deviceId),
    enabled: Boolean(deviceId),
  });

type UseDeviceOptions = {
  deviceId: string;
  queryConfig?: QueryConfig<typeof getDeviceQueryOptions>;
};

export const useDevice = ({ deviceId, queryConfig }: UseDeviceOptions) => {
  return useQuery({
    ...getDeviceQueryOptions(deviceId),
    ...queryConfig,
  });
};
