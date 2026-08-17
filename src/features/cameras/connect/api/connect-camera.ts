import { useMutation } from '@tanstack/react-query';

import { MutationConfig } from '@/lib/react-query';

export type ConnectCameraInput = {
  deviceId: string;
  username: string;
  password: string;
};

type ConnectCameraResult = {
  ok: boolean;
};

/** FastAPI has no connect endpoint yet — credentials only gate the add form. */
export const connectCamera = async (
  data: ConnectCameraInput,
): Promise<ConnectCameraResult> => {
  if (!data.username.trim() || !data.password.trim()) {
    throw new Error('Connection failed. Check credentials.');
  }

  return { ok: true };
};

type UseConnectCameraOptions = {
  mutationConfig?: MutationConfig<typeof connectCamera>;
};

export const useConnectCamera = ({
  mutationConfig,
}: UseConnectCameraOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: connectCamera,
  });
};
