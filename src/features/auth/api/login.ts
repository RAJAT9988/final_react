/**
 * Login API — POST /v1/auth/login and POST /v1/auth/login/verify-2fa
 *
 * JSON { email, password } → tokens, or an MFA challenge.
 * When mfa_required is true, complete 2FA with the challenge token + code.
 */

import { api } from '@/lib/api-client';
import { setTokens } from '@/lib/auth-tokens';
import { LoginTokenData } from '@/types/api';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type Verify2faInput = {
  challengeToken: string;
  code: string;
};

type LoginApiResponse = {
  access_token: string | null;
  refresh_token: string | null;
  token_type: string;
  mfa_required: boolean;
  challenge_token: string | null;
};

export class MfaRequiredError extends Error {
  challengeToken: string;

  constructor(challengeToken: string) {
    super('Two-factor authentication is required.');
    this.name = 'MfaRequiredError';
    this.challengeToken = challengeToken;
  }
}

const saveTokens = (response: LoginApiResponse): LoginTokenData => {
  if (!response.access_token) {
    throw new Error('Login failed');
  }

  setTokens({
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? '',
  });

  return {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    token_type: response.token_type,
    mfa_required: response.mfa_required,
    challenge_token: response.challenge_token,
  };
};

export const loginWithEmailAndPassword = async (
  data: LoginCredentials,
): Promise<LoginTokenData> => {
  const response = await api.post<LoginCredentials, LoginApiResponse>(
    '/v1/auth/login',
    {
      email: data.email,
      password: data.password,
    },
  );

  if (response.mfa_required) {
    if (!response.challenge_token) {
      throw new Error('Two-factor challenge is missing.');
    }
    throw new MfaRequiredError(response.challenge_token);
  }

  return saveTokens(response);
};

export const verifyLogin2fa = async (
  data: Verify2faInput,
): Promise<LoginTokenData> => {
  const response = await api.post<
    { challenge_token: string; code: string },
    LoginApiResponse
  >('/v1/auth/login/verify-2fa', {
    challenge_token: data.challengeToken,
    code: data.code.trim(),
  });

  return saveTokens(response);
};
