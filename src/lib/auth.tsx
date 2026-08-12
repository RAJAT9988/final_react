/**
 * AUTH MODULE — login / register / session for the whole app
 *
 * LOGIN flow:
 *   1. LoginForm checks fields with loginInputSchema
 *   2. login.ts → POST /api/v1/auth/login → save tokens
 *   3. get-user.ts → GET /api/v1/profile → current user
 *   4. useLogin caches that user so the app knows you are logged in
 */

import { configureAuth } from 'react-query-auth';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';

import { getUser } from '@/features/auth/api/get-user';
import { loginWithEmailAndPassword as loginApi } from '@/features/auth/api/login';
import { registerAccount } from '@/features/auth/api/register';
import { paths } from '@/config/paths';
import { AuthResponse, User } from '@/types/api';

import { clearTokens } from './auth-tokens';

// ========== 1) LOGIN FORM RULES ==========
// Checks email + password before calling the API
export const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Required')
    .email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

// TypeScript type from the schema above
export type LoginInput = z.infer<typeof loginInputSchema>;

// ========== 2) MAIN LOGIN SCRIPT ==========
// Step A: call login API and save tokens
// Step B: call profile API and get user
// Step C: return { jwt, user } to the auth library
const loginWithEmailAndPassword = async (
  data: LoginInput,
): Promise<AuthResponse> => {
  const tokens = await loginApi(data);
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

// ========== 3) LOGOUT SCRIPT ==========
// Delete access + refresh tokens from localStorage
const logout = async (): Promise<void> => {
  clearTokens();
};

// ========== 4) REGISTER FORM RULES ==========
// Matches fast-api-backend UserCreateRequest
export const registerInputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Must be at least 3 characters')
    .max(50, 'Must be at most 50 characters'),
  email: z.string().trim().min(1, 'Required').email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
});

// TypeScript type from the register schema
export type RegisterInput = z.infer<typeof registerInputSchema>;

// ========== 5) REGISTER API SCRIPT ==========
// POST /api/v1/auth/register
export const registerWithEmailAndPassword = (
  data: RegisterInput,
): Promise<User> => {
  return registerAccount(data);
};

// ========== 6) AUTH HOOKS SETUP ==========
// Connect our functions to react-query-auth hooks
const authConfig = {
  // App load: who is logged in?
  userFn: getUser,
  // Login button: run main login script, return user
  loginFn: async (data: LoginInput) => {
    const response = await loginWithEmailAndPassword(data);
    return response.user;
  },
  // Register: create account
  registerFn: async (data: RegisterInput) => {
    return registerWithEmailAndPassword(data);
  },
  // Logout button: clear tokens
  logoutFn: logout,
};

// Hooks used by LoginForm and other pages
export const { useUser, useLogin, useLogout, useRegister, AuthLoader } =
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
