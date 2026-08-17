import { useMutation } from '@tanstack/react-query';

import type { DiscoveredCamera } from '@/features/cameras/discover/components/discover-cameras';
import { MutationConfig } from '@/lib/react-query';

export type ScanNetworkResult = {
  ipRange: string;
  devices: DiscoveredCamera[];
};

export type ScanNetworkInput = Record<string, never>;

/** FastAPI has no discover endpoint yet — keep the tab usable without a 404. */
export const scanNetwork = async (
  input: ScanNetworkInput = {},
): Promise<ScanNetworkResult> => {
  void input;
  return {
    ipRange: '',
    devices: [],
  };
};

type UseScanNetworkOptions = {
  mutationConfig?: MutationConfig<typeof scanNetwork>;
};

export const useScanNetwork = ({
  mutationConfig,
}: UseScanNetworkOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: scanNetwork,
  });
};
