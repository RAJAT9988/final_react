import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { setTokens } from '@/lib/auth-tokens';
import { LoginTokenData } from '@/types/api';

export const refreshAuthToken = async (refreshToken: string) => {
  const tokens = await api.post<{ refresh_token: string }, LoginTokenData>(
    '/v1/auth/refresh-token',
    { refresh_token: refreshToken },
  );
  if (tokens.access_token) {
    setTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
    });
  }
  return tokens;
};

export const enable2fa = async () =>
  api.post<never, { secret: string; otpauth_uri: string }>(
    '/v1/auth/2fa/enable',
  );

export const confirm2fa = async (code: string) =>
  api.post('/v1/auth/2fa/confirm', { code });

export const disable2fa = async (code: string) =>
  api.post('/v1/auth/2fa/disable', { code });

export const restorePassword = async (email: string) =>
  api.post<{ email: string }, { reset_token?: string | null }>(
    '/v1/auth/restore-password',
    { email },
  );

export const resetPassword = async (data: {
  token: string;
  newPassword: string;
}) =>
  api.post('/v1/auth/reset-password', {
    token: data.token,
    new_password: data.newPassword,
  });

export const useEnable2fa = () => useMutation({ mutationFn: enable2fa });
export const useConfirm2fa = () => useMutation({ mutationFn: confirm2fa });
export const useDisable2fa = () => useMutation({ mutationFn: disable2fa });
export const useRestorePassword = () =>
  useMutation({ mutationFn: restorePassword });
export const useResetPassword = () =>
  useMutation({ mutationFn: resetPassword });
export const useRefreshAuthToken = () =>
  useMutation({ mutationFn: refreshAuthToken });
