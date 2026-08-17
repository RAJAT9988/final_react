import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export type RegisterSlaveInput = {
  name: string;
  ip: string;
  macId: string;
  serialNo: string;
  dnsName?: string;
};

export type RegisterSlaveResult = {
  device_id: string;
  approval_status: string;
};

export const registerSlave = async (
  data: RegisterSlaveInput,
): Promise<RegisterSlaveResult> => {
  return api.post('/v1/devices/register-slave', {
    role: 'slave',
    name: data.name.trim(),
    ip: data.ip.trim(),
    mac_id: data.macId.trim(),
    serial_no: data.serialNo.trim(),
    dns_name: data.dnsName?.trim() || null,
  });
};

type UseRegisterSlaveOptions = {
  mutationConfig?: MutationConfig<typeof registerSlave>;
};

export const useRegisterSlave = ({
  mutationConfig,
}: UseRegisterSlaveOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: registerSlave,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
