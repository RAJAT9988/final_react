import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { CompanyAddress } from '@/types/api';

export const getAddress = async (addressId: string): Promise<CompanyAddress> => {
  return api.get(`/v1/addresses/${addressId}`);
};

export const updateAddress = async ({
  addressId,
  data,
}: {
  addressId: string;
  data: Partial<CompanyAddress>;
}): Promise<CompanyAddress> => {
  return api.patch(`/v1/addresses/${addressId}`, data);
};

export const deleteAddress = async (addressId: string): Promise<void> => {
  await api.delete(`/v1/addresses/${addressId}`);
};

export const useAddress = (addressId: string) =>
  useQuery({
    queryKey: ['address', addressId],
    queryFn: () => getAddress(addressId),
    enabled: Boolean(addressId),
  });

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAddress,
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['address', vars.addressId],
      });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['address'] });
    },
  });
};
