import { queryOptions, useQuery } from '@tanstack/react-query';

import {
  mapDeviceDto,
  unwrapDeviceList,
} from '@/features/devices/adopted/api/get-adopted-devices';
import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { DeviceDto } from '@/types/api';

export const getDevicesByBranch = async (
  branchId: string,
): Promise<AdoptedDevice[]> => {
  const response = await api.get<unknown, DeviceDto[] | { data?: DeviceDto[] }>(
    `/v1/branches/${branchId}/devices`,
  );
  return unwrapDeviceList(response).map(mapDeviceDto);
};

export const getPendingDevicesByBranch = async (
  branchId: string,
): Promise<AdoptedDevice[]> => {
  const response = await api.get<unknown, DeviceDto[] | { data?: DeviceDto[] }>(
    `/v1/branches/${branchId}/devices/pending-approval`,
  );
  return unwrapDeviceList(response).map(mapDeviceDto);
};

export const getPendingDevicesQueryOptions = (branchId: string) =>
  queryOptions({
    queryKey: ['devices', 'pending', branchId],
    queryFn: () => getPendingDevicesByBranch(branchId),
    enabled: Boolean(branchId),
  });

type UsePendingDevicesOptions = {
  branchId: string;
  queryConfig?: QueryConfig<typeof getPendingDevicesQueryOptions>;
};

export const usePendingDevices = ({
  branchId,
  queryConfig,
}: UsePendingDevicesOptions) => {
  return useQuery({
    ...getPendingDevicesQueryOptions(branchId),
    ...queryConfig,
  });
};
