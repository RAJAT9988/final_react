import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { RoleDto, RoleWithPermissionsDto, User } from '@/types/api';

type UserDto = {
  user_id: string;
  name: string;
  email: string;
  role_id: number;
  company_id: string;
  status: string;
  mfa_enabled: boolean;
  role_name?: string | null;
  is_deleted?: boolean;
};

const toUser = (dto: UserDto): User => ({
  id: String(dto.user_id),
  user_id: String(dto.user_id),
  name: dto.name,
  email: dto.email,
  role_id: dto.role_id,
  company_id: String(dto.company_id),
  status: dto.status,
  mfa_enabled: dto.mfa_enabled,
  role_name: dto.role_name,
  is_deleted: dto.is_deleted,
});

const unwrapUsers = (response: UserDto[] | { data?: UserDto[] }) =>
  (Array.isArray(response) ? response : response.data ?? []).map(toUser);

export const listCompanyUsers = async (companyId: string): Promise<User[]> => {
  const response = await api.get<never, UserDto[] | { data?: UserDto[] }>(
    `/v1/companies/${companyId}/users`,
  );
  return unwrapUsers(response);
};

export const getCompanyUser = async (userId: string): Promise<User> => {
  const dto = await api.get<never, UserDto>(`/v1/users/${userId}`);
  return toUser(dto);
};

export const addCompanyUser = async ({
  companyId,
  data,
}: {
  companyId: string;
  data: { name: string; email: string; password: string; role_id: number };
}): Promise<User> => {
  const dto = await api.post<typeof data, UserDto>(
    `/v1/companies/${companyId}/users`,
    data,
  );
  return toUser(dto);
};

export const updateCompanyUser = async ({
  userId,
  data,
}: {
  userId: string;
  data: { name?: string; email?: string };
}): Promise<User> => {
  const dto = await api.patch<typeof data, UserDto>(
    `/v1/users/${userId}`,
    data,
  );
  return toUser(dto);
};

export const deleteCompanyUser = async (userId: string): Promise<void> => {
  await api.delete(`/v1/users/${userId}`);
};

export const assignUserRole = async ({
  userId,
  roleId,
}: {
  userId: string;
  roleId: number;
}): Promise<User> => {
  const dto = await api.patch<{ role_id: number }, UserDto>(
    `/v1/users/${userId}/role`,
    { role_id: roleId },
  );
  return toUser(dto);
};

export const enableUser = async (userId: string): Promise<User> =>
  toUser(await api.post(`/v1/users/${userId}/enable`, {}));

export const disableUser = async (userId: string): Promise<User> =>
  toUser(await api.post(`/v1/users/${userId}/disable`, {}));

export const resetUserPassword = async (userId: string) =>
  api.post(`/v1/users/${userId}/reset-password`, {});

export const forceLogoutUser = async (userId: string): Promise<User> =>
  toUser(await api.post(`/v1/users/${userId}/force-logout`, {}));

export const listRoles = async (): Promise<RoleDto[]> => {
  const response = await api.get<never, RoleDto[] | { data?: RoleDto[] }>(
    '/v1/roles',
  );
  return Array.isArray(response) ? response : response.data ?? [];
};

export const getRolePermissions = async (
  roleId: number,
): Promise<RoleWithPermissionsDto> =>
  api.get(`/v1/roles/${roleId}/permissions`);

export const useCompanyUsers = (companyId: string) =>
  useQuery(
    queryOptions({
      queryKey: ['users', companyId],
      queryFn: () => listCompanyUsers(companyId),
      enabled: Boolean(companyId),
    }),
  );

export const useRoles = () =>
  useQuery({
    queryKey: ['roles'],
    queryFn: listRoles,
  });

export const useRolePermissions = (roleId: number) =>
  useQuery({
    queryKey: ['roles', roleId, 'permissions'],
    queryFn: () => getRolePermissions(roleId),
    enabled: roleId > 0,
  });

const invalidateUsers = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: ['users'] });
};

export const useAddCompanyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCompanyUser,
    onSuccess: () => invalidateUsers(queryClient),
  });
};

export const useUpdateCompanyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompanyUser,
    onSuccess: () => invalidateUsers(queryClient),
  });
};

export const useDeleteCompanyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompanyUser,
    onSuccess: () => invalidateUsers(queryClient),
  });
};

export const useAssignUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignUserRole,
    onSuccess: () => invalidateUsers(queryClient),
  });
};

export const useEnableUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableUser,
    onSuccess: () => invalidateUsers(queryClient),
  });
};

export const useDisableUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disableUser,
    onSuccess: () => invalidateUsers(queryClient),
  });
};

export const useResetUserPassword = () =>
  useMutation({ mutationFn: resetUserPassword });

export const useForceLogoutUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forceLogoutUser,
    onSuccess: () => invalidateUsers(queryClient),
  });
};
