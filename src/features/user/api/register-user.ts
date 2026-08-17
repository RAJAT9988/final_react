/**
 * User registration API — POST /v1/auth/register
 *
 * Creates the first account for the company (backend assigns Owner).
 * Does NOT log the user in — they continue to the login step after this.
 */

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export type RegisterUserInput = {
  companyId: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
};

export type RegisteredUser = {
  userId: string;
};

type RegisterUserPayload = {
  company_id: string;
  name: string;
  email: string;
  password: string;
};

type RegisterUserResponse = {
  user_id: string;
};

export const registerUser = async (
  data: RegisterUserInput,
): Promise<RegisteredUser> => {
  const response = await api.post<RegisterUserPayload, RegisterUserResponse>(
    '/v1/auth/register',
    {
      company_id: data.companyId,
      name: data.name,
      email: data.email,
      password: data.password,
    },
  );

  if (!response.user_id) {
    throw new Error('Registration failed');
  }

  return { userId: String(response.user_id) };
};

type UseRegisterUserOptions = {
  mutationConfig?: MutationConfig<typeof registerUser>;
};

export const useRegisterUser = ({
  mutationConfig,
}: UseRegisterUserOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: registerUser,
  });
};
