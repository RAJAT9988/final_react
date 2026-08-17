import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import type { DeviceRole } from '@/features/devices/adopted/components/adopted-devices';
import { cn } from '@/utils/cn';

export type AddDeviceInput = {
  deviceName: string;
  ip: string;
  deviceRole: DeviceRole;
  serialNo: string;
  macId: string;
  manufacturingDate?: string;
  dnsName?: string;
};

const deviceFieldsSchema = z.object({
  deviceName: z.string().trim().min(1, 'Required'),
  ip: z.string().trim().min(1, 'Required'),
  deviceRole: z.enum(['standalone', 'master', 'slave']),
  serialNo: z.string().trim().min(1, 'Required'),
  macId: z.string().trim().min(1, 'Required'),
  manufacturingDate: z.string().optional(),
  dnsName: z.string().optional(),
});

type DeviceFields = z.infer<typeof deviceFieldsSchema>;

type AddDeviceFormProps = {
  initialName?: string;
  initialIp?: string;
  initialDeviceRole?: DeviceRole;
  initialSerialNo?: string;
  initialMacId?: string;
  onBack: () => void;
  onSave: (values: AddDeviceInput) => void;
};

export const AddDeviceForm = ({
  initialName = '',
  initialIp = '',
  initialDeviceRole = 'standalone',
  initialSerialNo = '',
  initialMacId = '',
  onBack,
  onSave,
}: AddDeviceFormProps) => {
  return (
    <Form
      schema={deviceFieldsSchema}
      onSubmit={(values: DeviceFields) => {
        onSave(values);
      }}
      options={{
        defaultValues: {
          deviceName: initialName,
          ip: initialIp,
          deviceRole: initialDeviceRole,
          serialNo: initialSerialNo,
          macId: initialMacId,
          manufacturingDate: '',
          dnsName: '',
        },
      }}
    >
      {({ register, formState, watch }) => {
        const deviceName = watch('deviceName');
        const ip = watch('ip');
        const deviceRole = watch('deviceRole');
        const serialNo = watch('serialNo');
        const macId = watch('macId');

        const nameOk = Boolean(deviceName?.trim());
        const ipOk = Boolean(ip?.trim());

        return (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Device
                </p>
                <Input
                  label="Device name"
                  error={formState.errors['deviceName']}
                  registration={register('deviceName')}
                />
                <Input
                  label="IP"
                  error={formState.errors['ip']}
                  registration={register('ip')}
                  placeholder="192.168.1.20"
                />
                <Select
                  label="Device role"
                  error={formState.errors['deviceRole']}
                  registration={register('deviceRole')}
                  options={[
                    { label: 'standalone', value: 'standalone' },
                    { label: 'master', value: 'master' },
                    { label: 'slave', value: 'slave' },
                  ]}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Serial no."
                    error={formState.errors['serialNo']}
                    registration={register('serialNo')}
                  />
                  <Input
                    label="MAC ID"
                    error={formState.errors['macId']}
                    registration={register('macId')}
                  />
                  <Input
                    label="Manufacturing date"
                    type="date"
                    registration={register('manufacturingDate')}
                  />
                  <Input
                    label="DNS name"
                    registration={register('dnsName')}
                    placeholder="optional"
                  />
                </div>
                {deviceRole === 'slave' ? (
                  <p className="text-sm text-amber-700">
                    Slave devices are registered for approval instead of being
                    added directly to the branch.
                  </p>
                ) : null}
              </section>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit">Save device</Button>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Summary
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Name</span>
                    <strong className="text-right text-slate-900">
                      {deviceName?.trim() || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">IP</span>
                    <strong className="text-right text-slate-900">
                      {ip?.trim() || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Role</span>
                    <strong className="capitalize text-slate-900">
                      {deviceRole}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Serial</span>
                    <strong className="text-right text-slate-900">
                      {serialNo?.trim() || '—'}
                    </strong>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">MAC</span>
                    <strong className="text-right text-slate-900">
                      {macId?.trim() || '—'}
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
                    {nameOk ? '✓' : '○'} Device name set
                  </li>
                  <li
                    className={cn(ipOk ? 'text-emerald-700' : 'text-slate-500')}
                  >
                    {ipOk ? '✓' : '○'} IP set
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
