import { Cable, LayoutGrid, Puzzle, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { useDeleteCamera } from '@/features/cameras/adopted/api/delete-camera';
import { useUpdateCamera } from '@/features/cameras/adopted/api/update-camera';
import { useUpdateCameraStatus } from '@/features/cameras/adopted/api/update-camera-status';
import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import {
  CameraSourcesEditor,
  createCameraSource,
  type CameraSourceDraft,
} from '@/features/cameras/adopted/components/camera-sources-editor';
import { cn } from '@/utils/cn';

type DrawerTab = 'overview' | 'sources' | 'settings' | 'plugins';

type CameraDetailsDrawerProps = {
  camera: AdoptedCamera | null;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
};

const tabs: { id: DrawerTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'sources', label: 'Sources', icon: Cable },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
];

const statusClass = {
  Online: 'bg-emerald-500/15 text-emerald-700',
  Connecting: 'bg-amber-500/15 text-amber-700',
  Error: 'bg-red-500/15 text-red-700',
} as const;

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  location: z.string().trim().min(1, 'Required'),
  zone: z.string().optional(),
  department: z.string().optional(),
  cameraGroup: z.string().optional(),
  cameraStatus: z.enum(['online', 'offline', 'disconnected']),
});

type SettingsFields = z.infer<typeof settingsSchema>;

const optionalText = (value?: string): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toApiStatus = (
  status: AdoptedCamera['status'] | string,
): SettingsFields['cameraStatus'] => {
  const value = status.toLowerCase();
  if (value === 'online') return 'online';
  if (value === 'disconnected' || value === 'error') return 'disconnected';
  return 'offline';
};

const defaultSourcesForCamera = (
  camera: AdoptedCamera,
): CameraSourceDraft[] => [
  createCameraSource({
    name: 'High stream',
    role: 'high',
    url: camera.rtspUrl?.trim() || `rtsp://192.168.1.10/${camera.id}/high`,
  }),
  createCameraSource({
    name: 'Snapshot',
    role: 'snapshot',
    url: `rtsp://192.168.1.10/${camera.id}/snapshot`,
  }),
];

export const CameraDetailsDrawer = ({
  camera,
  open,
  onClose,
  onDeleted,
}: CameraDetailsDrawerProps) => {
  const { addNotification } = useNotifications();
  const [tab, setTab] = useState<DrawerTab>('overview');
  const [sources, setSources] = useState<CameraSourceDraft[]>([]);
  const updateCamera = useUpdateCamera();
  const updateStatus = useUpdateCameraStatus();
  const deleteCamera = useDeleteCamera();

  useEffect(() => {
    if (!open || !camera) return;
    setTab('overview');
    setSources(defaultSourcesForCamera(camera));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when a different camera is opened
  }, [open, camera?.id]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !camera) return null;

  const now = new Date().toLocaleString();
  const liveCount = sources.filter((s) => s.role !== 'snapshot').length;

  const saveSources = () => {
    const incomplete = sources.some((s) => !s.name.trim() || !s.url.trim());
    const hasLive = sources.some((s) => s.url.trim() && s.role !== 'snapshot');

    if (incomplete) {
      addNotification({
        type: 'error',
        title: 'Sources incomplete',
        message: 'Each source needs a name and URL.',
      });
      return;
    }
    if (!hasLive) {
      addNotification({
        type: 'error',
        title: 'Live stream required',
        message: 'Add at least one live stream (not only snapshot).',
      });
      return;
    }

    const liveSource = sources.find(
      (source) => source.role !== 'snapshot' && source.url.trim(),
    );

    updateCamera.mutate({
      cameraId: camera.id,
      data: { rtsp_url: liveSource?.url.trim() || null },
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete ${camera.name}?`)) return;
    deleteCamera.mutate(camera.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Camera deleted',
          message: `${camera.name} was removed.`,
        });
        onDeleted?.();
        onClose();
      },
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close camera details"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-drawer-title"
        className="absolute inset-y-0 right-0 flex h-dvh w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-slate-200">
          <header className="flex items-center gap-3 px-5 py-4">
            <h2
              id="camera-drawer-title"
              className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900"
            >
              {camera.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="size-5" />
            </button>
          </header>

          <nav className="flex px-2">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 px-2 pb-3 pt-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-b-2 border-slate-900 text-slate-900'
                      : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'overview' ? (
            <div className="space-y-5">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
                <span className="absolute left-3 top-3 text-xs text-white/90">
                  {now}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-sm font-semibold tracking-wide text-white">
                  {camera.manufacturer.toLowerCase().includes('tp-link')
                    ? 'tapo'
                    : camera.manufacturer}
                </span>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Overview
                </p>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  <li className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Status</span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusClass[camera.status],
                      )}
                    >
                      {camera.status}
                    </span>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Sources</span>
                    <strong className="text-slate-900">{sources.length}</strong>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Live streams</span>
                    <strong className="text-slate-900">{liveCount}</strong>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Location</span>
                    <strong className="text-slate-900">
                      {camera.location || '—'}
                    </strong>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Zone</span>
                    <strong className="text-slate-900">
                      {camera.zone || '—'}
                    </strong>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Department</span>
                    <strong className="text-slate-900">
                      {camera.department || '—'}
                    </strong>
                  </li>
                  <li className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-slate-500">Group</span>
                    <strong className="text-slate-900">
                      {camera.cameraGroup || '—'}
                    </strong>
                  </li>
                </ul>
              </div>

              <p className="text-center text-sm text-slate-500">
                No sensors available
              </p>
            </div>
          ) : null}

          {tab === 'sources' ? (
            <div className="space-y-4">
              <CameraSourcesEditor sources={sources} onChange={setSources} />
              <Button type="button" className="w-full" onClick={saveSources}>
                Save sources
              </Button>
            </div>
          ) : null}

          {tab === 'settings' ? (
            <div className="space-y-5">
              <Form
                key={camera.id}
                schema={settingsSchema}
                options={{
                  defaultValues: {
                    name: camera.name,
                    location: camera.location,
                    zone: camera.zone,
                    department: camera.department,
                    cameraGroup: camera.cameraGroup,
                    cameraStatus: toApiStatus(
                      camera.cameraStatus || camera.status,
                    ),
                  },
                }}
                onSubmit={(values: SettingsFields) => {
                  updateCamera.mutate(
                    {
                      cameraId: camera.id,
                      data: {
                        camera_name: values.name.trim(),
                        location: values.location.trim(),
                        zone: optionalText(values.zone),
                        department: optionalText(values.department),
                        camera_group: optionalText(values.cameraGroup),
                      },
                    },
                    {
                      onSuccess: () => {
                        updateStatus.mutate({
                          cameraId: camera.id,
                          cameraStatus: values.cameraStatus,
                        });
                      },
                    },
                  );
                }}
              >
                {({ register, formState }) => (
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      error={formState.errors['name']}
                      registration={register('name')}
                    />
                    <Input
                      label="Location"
                      error={formState.errors['location']}
                      registration={register('location')}
                    />
                    <Input
                      label="Zone"
                      error={formState.errors['zone']}
                      registration={register('zone')}
                    />
                    <Input
                      label="Department"
                      error={formState.errors['department']}
                      registration={register('department')}
                    />
                    <Input
                      label="Camera group"
                      error={formState.errors['cameraGroup']}
                      registration={register('cameraGroup')}
                    />
                    <Select
                      label="Status"
                      error={formState.errors['cameraStatus']}
                      registration={register('cameraStatus')}
                      options={[
                        { label: 'online', value: 'online' },
                        { label: 'offline', value: 'offline' },
                        { label: 'disconnected', value: 'disconnected' },
                      ]}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={
                        updateCamera.isPending || updateStatus.isPending
                      }
                    >
                      Save settings
                    </Button>
                  </div>
                )}
              </Form>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                isLoading={deleteCamera.isPending}
                onClick={handleDelete}
              >
                Delete camera
              </Button>
            </div>
          ) : null}
          {tab === 'plugins' ? (
            <p className="text-sm text-slate-600">
              Plugins for this camera will go here.
            </p>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  );
};
