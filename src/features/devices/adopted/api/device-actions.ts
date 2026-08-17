import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  mapDeviceDto,
  unwrapDevice,
} from '@/features/devices/adopted/api/get-adopted-devices';
import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { DeviceDto } from '@/types/api';

const parseDevice = (
  response: DeviceDto | { data?: DeviceDto },
): AdoptedDevice => {
  const dto = unwrapDevice(response);
  if (!dto?.device_id) throw new Error('Device action failed');
  return mapDeviceDto(dto);
};

export const approveDevice = async (deviceId: string): Promise<AdoptedDevice> =>
  parseDevice(await api.post(`/v1/devices/${deviceId}/approve`, {}));

export const rejectDevice = async (deviceId: string): Promise<AdoptedDevice> =>
  parseDevice(await api.post(`/v1/devices/${deviceId}/reject`, {}));

export const reassignDevice = async ({
  deviceId,
  branchId,
}: {
  deviceId: string;
  branchId: string;
}): Promise<AdoptedDevice> =>
  parseDevice(
    await api.post(`/v1/devices/${deviceId}/reassign`, { branch_id: branchId }),
  );

export const useApproveDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveDevice,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useRejectDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectDevice,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
};

export const useReassignDevice = (
  options: { mutationConfig?: MutationConfig<typeof reassignDevice> } = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options.mutationConfig,
    mutationFn: reassignDevice,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      options.mutationConfig?.onSuccess?.(...args);
    },
  });
};
