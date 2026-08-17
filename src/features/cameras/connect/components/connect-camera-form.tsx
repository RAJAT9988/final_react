import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useConnectCamera } from '@/features/cameras/connect/api/connect-camera';

const connectSchema = z.object({
  username: z.string().trim().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

type ConnectInput = z.infer<typeof connectSchema>;

type ConnectCameraFormProps = {
  open: boolean;
  deviceId: string;
  deviceName: string;
  onCancel: () => void;
  onContinue: () => void;
};

export const ConnectCameraForm = ({
  open,
  deviceId,
  deviceName,
  onCancel,
  onContinue,
}: ConnectCameraFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const connectCamera = useConnectCamera({
    mutationConfig: {
      onSuccess: () => {
        setError(null);
        onContinue();
      },
      onError: (err) => {
        setError(err.message || 'Connection failed. Check credentials.');
      },
    },
  });

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !connectCamera.isPending) onCancel();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel, connectCamera.isPending]);

  useEffect(() => {
    if (open) setError(null);
  }, [open, deviceId]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close connect dialog"
        className="absolute inset-0 bg-slate-900/40"
        onClick={() => {
          if (!connectCamera.isPending) onCancel();
        }}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-camera-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-7"
      >
        <header className="mb-5 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2
              id="connect-camera-title"
              className="text-base font-semibold text-slate-900"
            >
              Connect {deviceName}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Type the camera username and password, then continue.
            </p>
          </div>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            disabled={connectCamera.isPending}
            onClick={onCancel}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </header>

        <Form
          key={deviceId}
          schema={connectSchema}
          onSubmit={(values: ConnectInput) => {
            setError(null);
            connectCamera.mutate({
              deviceId,
              username: values.username,
              password: values.password,
            });
          }}
          options={{
            defaultValues: {
              username: '',
              password: '',
            },
          }}
        >
          {({ register, formState }) => (
            <div className="space-y-4">
              <Input
                label="Username"
                error={formState.errors['username']}
                registration={register('username')}
                autoComplete="username"
              />
              <Input
                type="password"
                label="Password"
                error={formState.errors['password']}
                registration={register('password')}
                autoComplete="current-password"
              />

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={connectCamera.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={connectCamera.isPending}>
                  Continue
                </Button>
              </div>
            </div>
          )}
        </Form>
      </section>
    </div>,
    document.body,
  );
};
