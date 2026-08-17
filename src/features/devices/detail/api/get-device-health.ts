/**
 * Device health — GET /v1/devices/{id}/health/latest
 * Ingest — POST /v1/devices/{id}/health
 */

import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, QueryConfig } from '@/lib/react-query';
import { DeviceHealthCreatePayload, DeviceHealthDto } from '@/types/api';

export type DeviceHealth = {
  deviceHealthId: string;
  deviceId: string;
  cpuUsage: number;
  npuUsage: number;
  ram: number;
  temperature: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  isSystemRecord: boolean;
  isDeleted: boolean;
};

const toDeviceHealth = (
  dto: DeviceHealthDto,
  deviceId: string,
): DeviceHealth => ({
  deviceHealthId: String(dto.device_health_id),
  deviceId,
  cpuUsage: dto.cpu_usage,
  npuUsage: dto.npu_usage,
  ram: dto.ram,
  temperature: dto.temperature,
  createdAt: dto.created_at ?? '',
  createdBy: '—',
  updatedAt: dto.updated_at ?? '',
  updatedBy: '—',
  isSystemRecord: false,
  isDeleted: Boolean(dto.is_deleted),
});

export const getDeviceHealth = async (
  deviceId: string,
): Promise<DeviceHealth | null> => {
  try {
    const dto = await api.get<unknown, DeviceHealthDto>(
      `/v1/devices/${deviceId}/health/latest`,
    );
    if (!dto?.device_health_id) return null;
    return toDeviceHealth(dto, deviceId);
  } catch {
    return null;
  }
};

export const ingestDeviceHealth = async ({
  deviceId,
  data,
}: {
  deviceId: string;
  data: DeviceHealthCreatePayload;
}): Promise<DeviceHealth> => {
  const dto = await api.post<DeviceHealthCreatePayload, DeviceHealthDto>(
    `/v1/devices/${deviceId}/health`,
    data,
  );
  return toDeviceHealth(dto, deviceId);
};

export const getDeviceHealthQueryOptions = (deviceId: string) =>
  queryOptions({
    queryKey: ['devices', 'health', deviceId],
    queryFn: () => getDeviceHealth(deviceId),
    enabled: Boolean(deviceId),
  });

type UseDeviceHealthOptions = {
  deviceId: string;
  queryConfig?: QueryConfig<typeof getDeviceHealthQueryOptions>;
};

export const useDeviceHealth = ({
  deviceId,
  queryConfig,
}: UseDeviceHealthOptions) => {
  return useQuery({
    ...getDeviceHealthQueryOptions(deviceId),
    ...queryConfig,
  });
};

type UseIngestDeviceHealthOptions = {
  mutationConfig?: MutationConfig<typeof ingestDeviceHealth>;
};

export const useIngestDeviceHealth = ({
  mutationConfig,
}: UseIngestDeviceHealthOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: ingestDeviceHealth,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices', 'health'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
