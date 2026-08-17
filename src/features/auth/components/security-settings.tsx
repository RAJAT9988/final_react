import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import {
  useConfirm2fa,
  useDisable2fa,
  useEnable2fa,
  useRefreshAuthToken,
  useResetPassword,
  useRestorePassword,
} from '@/features/auth/api/security';
import { useUser } from '@/lib/auth';
import { getRefreshToken } from '@/lib/auth-tokens';

export const SecuritySettings = () => {
  const { addNotification } = useNotifications();
  const userQuery = useUser();
  const user = userQuery.data;
  const enable2fa = useEnable2fa();
  const confirm2fa = useConfirm2fa();
  const disable2fa = useDisable2fa();
  const restore = useRestorePassword();
  const reset = useResetPassword();
  const refresh = useRefreshAuthToken();

  if (!user) return null;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Two-factor</h2>
        <p className="mt-1 text-sm text-slate-500">
          Status: {user.mfa_enabled ? 'enabled' : 'disabled'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              enable2fa.mutate(undefined as void, {
                onSuccess: (data) =>
                  addNotification({
                    type: 'info',
                    title: '2FA secret',
                    message: data.secret,
                  }),
              })
            }
          >
            Enable 2FA
          </Button>
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const code = (
              e.currentTarget.elements.namedItem('code') as HTMLInputElement
            ).value;
            const onDone = () => {
              void userQuery.refetch();
            };
            if (user.mfa_enabled) {
              disable2fa.mutate(code, { onSuccess: onDone });
            } else {
              confirm2fa.mutate(code, { onSuccess: onDone });
            }
          }}
        >
          <input
            name="code"
            placeholder="6-digit code"
            className="h-9 flex-1 rounded-md border border-slate-200 px-3 text-sm"
          />
          <Button type="submit" size="sm">
            {user.mfa_enabled ? 'Disable' : 'Confirm'}
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Password reset</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              restore.mutate(user.email, {
                onSuccess: (data) =>
                  addNotification({
                    type: 'info',
                    title: 'Reset token',
                    message: data.reset_token || 'Check email / token issued.',
                  }),
              })
            }
          >
            Request reset token
          </Button>
        </div>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            reset.mutate({
              token: (form.elements.namedItem('token') as HTMLInputElement)
                .value,
              newPassword: (
                form.elements.namedItem('newPassword') as HTMLInputElement
              ).value,
            });
          }}
        >
          <input
            name="token"
            placeholder="Reset token"
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
          <input
            name="newPassword"
            type="password"
            placeholder="New password"
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
          <Button type="submit" size="sm">
            Reset password
          </Button>
        </form>
      </section>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const token = getRefreshToken();
          if (!token) {
            addNotification({
              type: 'error',
              title: 'No refresh token',
              message: 'Log in again to get a refresh token.',
            });
            return;
          }
          refresh.mutate(token);
        }}
      >
        Refresh session
      </Button>
    </div>
  );
};
