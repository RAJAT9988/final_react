import { useMutation } from '@tanstack/react-query';

import type { DiscoveredDevice } from '@/features/devices/discover/components/discover-devices';
import { MutationConfig } from '@/lib/react-query';

export type ScanDevicesResult = {
  ipRange: string;
  devices: DiscoveredDevice[];
};

export type ScanDevicesInput = Record<string, never>;

/** FastAPI has no discover endpoint yet. */
export const scanDevices = async (
  input: ScanDevicesInput = {},
): Promise<ScanDevicesResult> => {
  void input;
  return {
    ipRange: '',
    devices: [],
  };
};

type UseScanDevicesOptions = {
  mutationConfig?: MutationConfig<typeof scanDevices>;
};

export const useScanDevices = ({
  mutationConfig,
}: UseScanDevicesOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: scanDevices,
  });
};
