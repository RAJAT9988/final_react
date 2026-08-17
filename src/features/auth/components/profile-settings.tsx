import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { useUpdateProfile } from '@/features/auth/api/update-profile';
import { useUser } from '@/lib/auth';

export const ProfileSettings = () => {
  const { addNotification } = useNotifications();
  const userQuery = useUser();
  const user = userQuery.data;
  const updateProfile = useUpdateProfile();

  if (!user) return null;

  return (
    <form
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        updateProfile.mutate(
          {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
          },
          {
            onSuccess: () => {
              void userQuery.refetch();
              addNotification({
                type: 'success',
                title: 'Profile updated',
                message: 'Your profile was saved.',
              });
            },
          },
        );
      }}
    >
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Name</span>
        <input
          name="name"
          defaultValue={user.name}
          className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={user.email}
          className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
        />
      </label>
      <Button type="submit" isLoading={updateProfile.isPending}>
        Save profile
      </Button>
    </form>
  );
};
