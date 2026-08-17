/**
 * Delete camera — DELETE /v1/cameras/{id}
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export const deleteCamera = async (cameraId: string): Promise<void> => {
  await api.delete(`/v1/cameras/${cameraId}`);
};

type UseDeleteCameraOptions = {
  mutationConfig?: MutationConfig<typeof deleteCamera>;
};

export const useDeleteCamera = ({
  mutationConfig,
}: UseDeleteCameraOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: deleteCamera,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['cameras'] });
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
