import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import {
  useAddCompanyUser,
  useAssignUserRole,
  useDeleteCompanyUser,
  useDisableUser,
  useEnableUser,
  useForceLogoutUser,
  useCompanyUsers,
  useResetUserPassword,
  useRolePermissions,
  useRoles,
  useUpdateCompanyUser,
} from '@/features/users/api/manage-users';

type UsersSettingsProps = {
  companyId: string;
};

export const UsersSettings = ({ companyId }: UsersSettingsProps) => {
  const { addNotification } = useNotifications();
  const usersQuery = useCompanyUsers(companyId);
  const rolesQuery = useRoles();
  const addUser = useAddCompanyUser();
  const updateUser = useUpdateCompanyUser();
  const deleteUser = useDeleteCompanyUser();
  const enableUser = useEnableUser();
  const disableUser = useDisableUser();
  const assignRole = useAssignUserRole();
  const resetPassword = useResetUserPassword();
  const forceLogout = useForceLogoutUser();
  const [roleId, setRoleId] = useState(0);
  const permissionsQuery = useRolePermissions(roleId);

  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          addUser.mutate({
            companyId,
            data: {
              name: (form.elements.namedItem('name') as HTMLInputElement).value,
              email: (form.elements.namedItem('email') as HTMLInputElement)
                .value,
              password: (
                form.elements.namedItem('password') as HTMLInputElement
              ).value,
              role_id: Number(
                (form.elements.namedItem('role_id') as HTMLSelectElement).value,
              ),
            },
          });
        }}
      >
        <input
          name="name"
          placeholder="Name"
          className="h-9 rounded-md border border-slate-200 px-3 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="h-9 rounded-md border border-slate-200 px-3 text-sm"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="h-9 rounded-md border border-slate-200 px-3 text-sm"
        />
        <select
          name="role_id"
          className="h-9 rounded-md border border-slate-200 px-3 text-sm"
        >
          {(rolesQuery.data ?? []).map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name}
            </option>
          ))}
        </select>
        <Button type="submit" isLoading={addUser.isPending}>
          Add user
        </Button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Role permissions
        </h2>
        <select
          className="mt-3 h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          value={roleId || ''}
          onChange={(e) => setRoleId(Number(e.target.value))}
        >
          <option value="">Select a role</option>
          {(rolesQuery.data ?? []).map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name}
            </option>
          ))}
        </select>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {(permissionsQuery.data?.permissions ?? []).map((permission) => (
            <li key={permission.permission_id}>
              {permission.module}:{permission.action} — {permission.name}
            </li>
          ))}
        </ul>
      </section>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {(usersQuery.data ?? []).map((item) => (
          <li key={item.user_id} className="space-y-2 px-4 py-3 text-sm">
            <form
              className="grid gap-2 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                updateUser.mutate({
                  userId: item.user_id,
                  data: {
                    name: (form.elements.namedItem('name') as HTMLInputElement)
                      .value,
                    email: (
                      form.elements.namedItem('email') as HTMLInputElement
                    ).value,
                  },
                });
              }}
            >
              <input
                name="name"
                defaultValue={item.name}
                className="h-8 rounded-md border border-slate-200 px-2 text-sm"
              />
              <input
                name="email"
                defaultValue={item.email}
                className="h-8 rounded-md border border-slate-200 px-2 text-sm"
              />
              <Button type="submit" size="sm" variant="outline">
                Save
              </Button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-slate-500">
                {item.role_name || item.role_id} · {item.status}
              </p>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    item.status === 'Active'
                      ? disableUser.mutate(item.user_id)
                      : enableUser.mutate(item.user_id)
                  }
                >
                  {item.status === 'Active' ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    resetPassword.mutate(item.user_id, {
                      onSuccess: (result) =>
                        addNotification({
                          type: 'success',
                          title: 'Reset token',
                          message:
                            (result as { reset_token?: string }).reset_token ||
                            'Password reset started.',
                        }),
                    })
                  }
                >
                  Reset password
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => forceLogout.mutate(item.user_id)}
                >
                  Force logout
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (!window.confirm(`Delete ${item.name}?`)) return;
                    deleteUser.mutate(item.user_id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
            <select
              className="h-8 rounded-md border border-slate-200 px-2 text-xs"
              defaultValue={item.role_id}
              onChange={(e) =>
                assignRole.mutate({
                  userId: item.user_id,
                  roleId: Number(e.target.value),
                })
              }
            >
              {(rolesQuery.data ?? []).map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
};
