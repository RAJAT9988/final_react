import { queryOptions, useQuery } from '@tanstack/react-query';

import type {
  DeviceRegistrationRole,
  DeviceStatus,
} from '@/features/setup/config';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { ApiResponse } from '@/types/api';

export type CurrentDevice = {
  id: string;
  name: string;
  ip: string;
  deviceRole: DeviceRegistrationRole;
  status: DeviceStatus;
  serialNo: string;
  macId: string;
};

type CurrentDeviceDto = {
  device_id: string;
  device_name: string;
  ip: string;
  device_role?: DeviceRegistrationRole | null;
  status?: DeviceStatus | null;
  serial_no?: string | null;
  mac_id?: string | null;
};

const toCurrentDevice = (dto: CurrentDeviceDto): CurrentDevice => ({
  id: dto.device_id,
  name: dto.device_name,
  ip: dto.ip,
  deviceRole: dto.device_role ?? 'standalone',
  status: dto.status ?? 'Active',
  serialNo: dto.serial_no ?? '',
  macId: dto.mac_id ?? '',
});

export const getCurrentDevice = async (): Promise<CurrentDevice> => {
  const response = await api.get<never, ApiResponse<CurrentDeviceDto>>(
    '/v1/devices/current',
  );

  if (!response.data?.device_id) {
    throw new Error(response.message || 'Failed to load this device');
  }

  return toCurrentDevice(response.data);
};

export const getCurrentDeviceQueryOptions = () =>
  queryOptions({
    queryKey: ['devices', 'current'],
    queryFn: getCurrentDevice,
  });

type UseCurrentDeviceOptions = {
  queryConfig?: QueryConfig<typeof getCurrentDeviceQueryOptions>;
};

export const useCurrentDevice = ({
  queryConfig,
}: UseCurrentDeviceOptions = {}) => {
  return useQuery({
    ...getCurrentDeviceQueryOptions(),
    ...queryConfig,
  });
};
