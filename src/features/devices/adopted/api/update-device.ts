/**
 * Update device — PATCH /v1/devices/{id}
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  mapDeviceDto,
  unwrapDevice,
} from '@/features/devices/adopted/api/get-adopted-devices';
import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { DeviceDto, DeviceUpdatePayload } from '@/types/api';

export type UpdateDeviceInput = {
  deviceId: string;
  data: DeviceUpdatePayload;
};

export const updateDevice = async ({
  deviceId,
  data,
}: UpdateDeviceInput): Promise<AdoptedDevice> => {
  const device = await api.patch<
    DeviceUpdatePayload,
    DeviceDto | { data?: DeviceDto }
  >(`/v1/devices/${deviceId}`, data);

  const dto = unwrapDevice(device);
  if (!dto?.device_id) throw new Error('Failed to update device');
  return mapDeviceDto(dto);
};

type UseUpdateDeviceOptions = {
  mutationConfig?: MutationConfig<typeof updateDevice>;
};

export const useUpdateDevice = ({
  mutationConfig,
}: UseUpdateDeviceOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: updateDevice,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
