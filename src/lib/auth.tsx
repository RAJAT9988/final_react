/**
 * AUTH MODULE — login / session for the whole app
 *
 * LOGIN flow:
 *   1. LoginForm checks fields with loginInputSchema
 *   2. login.ts → POST /v1/auth/login → save tokens
 *   3. get-user.ts → GET /v1/profile → current user
 *   4. useLogin caches that user so the app knows you are logged in
 *
 * Account creation lives on the User setup step (POST /v1/auth/register).
 */

import { configureAuth } from 'react-query-auth';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';

import { paths } from '@/config/paths';
import { getUser } from '@/features/auth/api/get-user';
import {
  loginWithEmailAndPassword as loginApi,
  verifyLogin2fa,
  type Verify2faInput,
} from '@/features/auth/api/login';
import { AuthResponse } from '@/types/api';

import { clearTokens } from './auth-tokens';

// ========== 1) LOGIN FORM RULES ==========
// Checks email + password before calling the API
export const loginInputSchema = z.object({
  email: z.string().trim().min(1, 'Required').email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

export const login2faInputSchema = z.object({
  code: z.string().trim().min(6, 'Enter the 6-digit code'),
});

// TypeScript type from the schema above
export type LoginInput = z.infer<typeof loginInputSchema>;
export type LoginFnInput = LoginInput | Verify2faInput;

// ========== 2) MAIN LOGIN SCRIPT ==========
// Step A: call login API (or 2FA verify) and save tokens
// Step B: call profile API and get user
// Step C: return { jwt, user } to the auth library
const completeLogin = async (tokens: {
  access_token: string;
}): Promise<AuthResponse> => {
  const user = await getUser();

  if (!user) {
    clearTokens();
    throw new Error('Failed to load user profile');
  }

  return {
    jwt: tokens.access_token,
    user,
  };
};

const loginWithEmailAndPassword = async (
  data: LoginFnInput,
): Promise<AuthResponse> => {
  const tokens =
    'challengeToken' in data
      ? await verifyLogin2fa(data)
      : await loginApi(data);

  return completeLogin(tokens);
};

// ========== 3) LOGOUT SCRIPT ==========
// Delete access + refresh tokens from localStorage
const logout = async (): Promise<void> => {
  clearTokens();
};

// ========== 4) AUTH HOOKS SETUP ==========
// Connect our functions to react-query-auth hooks
const authConfig = {
  // App load: who is logged in?
  userFn: getUser,
  // Login button: run main login script, return user
  loginFn: async (data: LoginFnInput) => {
    const response = await loginWithEmailAndPassword(data);
    return response.user;
  },
  registerFn: async () => {
    throw new Error('Use the User setup step to create an account');
  },
  // Logout button: clear tokens
  logoutFn: logout,
};

// Hooks used by LoginForm and other pages
export const { useUser, useLogin, useLogout, AuthLoader } =
  configureAuth(authConfig);

// ========== 7) PROTECTED ROUTE ==========
// No user → go to login page
// Has user → show the page
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const location = useLocation();

  if (!user.data) {
    return (
      <Navigate to={paths.setup.login.getHref(location.pathname)} replace />
    );
  }

  return children;
};
