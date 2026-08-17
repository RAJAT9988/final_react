import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getUser } from '@/features/auth/api/get-user';
import { api } from '@/lib/api-client';
import { User } from '@/types/api';

export type UpdateProfileInput = {
  name?: string;
  email?: string;
};

export const updateProfile = async (
  data: UpdateProfileInput,
): Promise<User> => {
  await api.patch('/v1/profile', data);
  const user = await getUser();
  if (!user) throw new Error('Failed to reload profile');
  return user;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(['authenticated-user'], user);
    },
  });
};
