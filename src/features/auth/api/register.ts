/**
 * Register API — POST /api/v1/auth/register
 *
 * Takes username + email + password → creates user on backend.
 * Does NOT log the user in (they must use the login page after this).
 */

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { ApiResponse, User } from '@/types/api';

// ========== 1) FORM INPUT SHAPE ==========
// What the register form sends
export type RegisterCredentials = {
  username: string;
  email: string;
  password: string;
};

// ========== 2) MAIN API CALL ==========
// Create account on backend and return the new user (includes user id)
export const registerAccount = async (
  data: RegisterCredentials,
): Promise<User> => {
  // THIS LINE talks to the backend:
  // POST {API_URL}/api/v1/auth/register
  const response = await api.post<RegisterCredentials, ApiResponse<User>>(
    '/api/v1/auth/register',
    {
      username: data.username,
      email: data.email,
      password: data.password,
    },
  );

  // Backend must return data.id (the new user id)
  if (!response.data?.id) {
    throw new Error(response.message || 'Registration failed');
  }

  // Give user object back (id is inside: response.data.id)
  return response.data;
};

// ========== 3) REACT QUERY HOOK ==========
// Lets RegisterForm call: registerAccount.mutate(values)
type UseRegisterAccountOptions = {
  mutationConfig?: MutationConfig<typeof registerAccount>;
};

export const useRegisterAccount = ({
  mutationConfig,
}: UseRegisterAccountOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    // When mutate() runs, call registerAccount above
    mutationFn: registerAccount,
  });
};
