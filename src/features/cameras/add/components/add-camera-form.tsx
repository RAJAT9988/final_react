import { useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { cn } from '@/utils/cn';

type SourceRole = 'high' | 'mid' | 'low' | 'snapshot';

export type CameraSource = {
  id: string;
  name: string;
  role: SourceRole;
  url: string;
};

export type AddCameraInput = {
  name: string;
  type: 'Camera';
  companyDeviceId: string;
  location: string;
  zone?: string;
  department?: string;
  cameraGroup?: string;
  sources: CameraSource[];
};

const cameraFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  companyDeviceId: z.string().trim().min(1, 'Select a device'),
  location: z.string().trim().min(1, 'Required'),
  zone: z.string().optional(),
  department: z.string().optional(),
  cameraGroup: z.string().optional(),
});

type CameraFields = z.infer<typeof cameraFieldsSchema>;

type AddCameraFormProps = {
  initialName?: string;
  initialCompanyDeviceId?: string;
  devices: { companyDeviceId: string; name: string }[];
  onBack: () => void;
  onSave: (values: AddCameraInput) => void;
};

const newSource = (): CameraSource => ({
  id: crypto.randomUUID(),
  name: 'Main stream',
  role: 'high',
  url: '',
});

export const AddCameraForm = ({
  initialName = '',
  initialCompanyDeviceId = '',
  devices,
  onBack,
  onSave,
}: AddCameraFormProps) => {
  const { addNotification } = useNotifications();
  const [sources, setSources] = useState<CameraSource[]>([newSource()]);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  return (
    <Form
      schema={cameraFieldsSchema}
      onSubmit={(values: CameraFields) => {
        const hasLive = sources.some(
          (s) => s.url.trim() && s.role !== 'snapshot',
        );
        const incomplete = sources.some((s) => !s.name.trim() || !s.url.trim());
        if (incomplete) {
          setSourcesError('Each source needs a name and URL.');
          return;
        }
        if (!hasLive) {
          setSourcesError('Add at least one live stream (not only snapshot).');
          return;
        }
        setSourcesError(null);
        onSave({ ...values, type: 'Camera', sources });
      }}
      options={{
        defaultValues: {
          name: initialName,
          companyDeviceId:
            initialCompanyDeviceId || devices[0]?.companyDeviceId || '',
          location: '',
          zone: '',
          department: '',
          cameraGroup: '',
        },
      }}
    >
      {({ register, formState, watch }) => {
        const name = watch('name');
        const location = watch('location');
        const zone = watch('zone');
        const department = watch('department');
        const cameraGroup = watch('cameraGroup');

        const nameOk = Boolean(name?.trim());
        const locationOk = Boolean(location?.trim());
        const streamOk = sources.some(
          (s) => s.url.trim() && s.role !== 'snapshot',
        );

        return (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Camera
                </p>
                <Input
                  label="Name"
                  error={formState.errors['name']}
                  registration={register('name')}
                />
                <Select
                  label="Device"
                  error={formState.errors['companyDeviceId']}
                  registration={register('companyDeviceId')}
                  options={devices.map((device) => ({
                    label: device.name,
                    value: device.companyDeviceId,
                  }))}
                />
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-700">Type</p>
                  <p className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900">
                    Camera
                  </p>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Placement
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Location is required. Zone, department, and group are optional.
                  </p>
                </div>
                <Input
                  label="Location"
                  error={formState.errors['location']}
                  registration={register('location')}
                  placeholder="Lobby, Gate 2…"
                />
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sources
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    At least one live stream is required.
                  </p>
                </div>

                {sources.map((source, index) => (
                  <div
                    key={source.id}
                    className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        Source {index + 1}
                      </p>
                      {sources.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSources((prev) =>
                              prev.filter((s) => s.id !== source.id),
                            )
                          }
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-700">Name</span>
                      <input
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                        value={source.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSources((prev) =>
                            prev.map((s) =>
                              s.id === source.id ? { ...s, name: value } : s,
                            ),
                          );
                        }}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-700">Role</span>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                        value={source.role}
                        onChange={(e) => {
                          const value = e.target.value as SourceRole;
                          setSources((prev) =>
                            prev.map((s) =>
                              s.id === source.id ? { ...s, role: value } : s,
                            ),
                          );
                        }}
                      >
                        <option value="high">high</option>
                        <option value="mid">mid</option>
                        <option value="low">low</option>
                        <option value="snapshot">snapshot</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-700">URL</span>
                      <input
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                        placeholder="rtsp://..."
                        value={source.url}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSources((prev) =>
                            prev.map((s) =>
                              s.id === source.id ? { ...s, url: value } : s,
                            ),
                          );
                        }}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        addNotification({
                          type: 'info',
                          title: 'Test source',
                          message: source.url
                            ? `Would test ${source.url}`
                            : 'Enter a URL first.',
                        })
                      }
                    >
                      Test source
                    </Button>
                  </div>
                ))}

                {sourcesError ? (
                  <p className="text-sm text-red-600">{sourcesError}</p>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSources((prev) => [...prev, newSource()])}
                >
                  + Add source
                </Button>
              </section>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit">Save camera</Button>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex aspect-video items-end rounded-lg bg-slate-900 p-3 text-white">
                  <div>
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                      NEW
                    </span>
                    <p className="mt-1 text-sm font-medium">
                      {name || 'Camera name'}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Device</span>
                    <strong className="text-right text-slate-900">
                      {devices.find(
                        (device) =>
                          device.companyDeviceId === watch('companyDeviceId'),
                      )?.name || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Type</span>
                    <strong className="text-slate-900">Camera</strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Location</span>
                    <strong className="text-right text-slate-900">
                      {location?.trim() || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Zone</span>
                    <strong className="text-right text-slate-900">
                      {zone?.trim() || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Department</span>
                    <strong className="text-right text-slate-900">
                      {department?.trim() || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Group</span>
                    <strong className="text-right text-slate-900">
                      {cameraGroup?.trim() || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Sources</span>
                    <strong className="text-slate-900">
                      {sources.length} stream{sources.length === 1 ? '' : 's'}
                    </strong>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Ready to save
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li
                    className={cn(
                      nameOk ? 'text-emerald-700' : 'text-slate-500',
                    )}
                  >
                    {nameOk ? '✓' : '○'} Camera name set
                  </li>
                  <li
                    className={cn(
                      locationOk ? 'text-emerald-700' : 'text-slate-500',
                    )}
                  >
                    {locationOk ? '✓' : '○'} Location set
                  </li>
                  <li
                    className={cn(
                      streamOk ? 'text-emerald-700' : 'text-slate-500',
                    )}
                  >
                    {streamOk ? '✓' : '○'} Live stream added
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        );
      }}
    </Form>
  );
};
