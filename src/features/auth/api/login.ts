/**
 * Login API — POST /api/v1/auth/login
 *
 * Takes email + password → gets JWT tokens → saves them in localStorage.
 * After this, other APIs can send the access token automatically.
 */

import { api } from '@/lib/api-client';
import { setTokens } from '@/lib/auth-tokens';
import { ApiResponse, LoginTokenData } from '@/types/api';

// ========== 1) FORM INPUT SHAPE ==========
// What the login form sends
export type LoginCredentials = {
  email: string;
  password: string;
};

// ========== 2) MAIN API CALL ==========
// Login on backend, store tokens, return token data
export const loginWithEmailAndPassword = async (
  data: LoginCredentials,
): Promise<LoginTokenData> => {
  // Backend login wants form data (OAuth2), not JSON
  const body = new URLSearchParams();
  // Field must be named "username", but we put the email value in it
  body.set('username', data.email);
  body.set('password', data.password);

  // THIS LINE talks to the backend:
  // POST {API_URL}/api/v1/auth/login
  const response = await api.post<URLSearchParams, ApiResponse<LoginTokenData>>(
    '/api/v1/auth/login',
    body,
    {
      // Tell backend this is form-urlencoded (OAuth2 style)
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  // No access token in response → login failed
  if (!response.data?.access_token) {
    throw new Error(response.message || 'Login failed');
  }

  // Save both tokens so later calls (like get-user) can use them
  setTokens({
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token.token,
  });

  // Give token payload back to the caller (auth.tsx)
  return response.data;
};
