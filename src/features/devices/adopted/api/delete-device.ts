/**
 * Delete device — DELETE /v1/devices/{id}
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export const deleteDevice = async (deviceId: string): Promise<void> => {
  await api.delete(`/v1/devices/${deviceId}`);
};

type UseDeleteDeviceOptions = {
  mutationConfig?: MutationConfig<typeof deleteDevice>;
};

export const useDeleteDevice = ({
  mutationConfig,
}: UseDeleteDeviceOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: deleteDevice,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
