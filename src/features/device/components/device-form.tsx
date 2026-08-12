/**
 * Device registration form — setup wizard step 6.
 * Frontend-only for now (saved in setup localStorage).
 * Form always starts empty and resets after success (no older values shown).
 */

import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import {
  createDeviceId,
  DEVICE_ROLES,
  DEVICE_STATUSES,
  readSetupState,
  writeSetupState,
  type DeviceRegistrationRole,
} from '@/features/setup/config';

const deviceSchema = z.object({
  deviceName: z
    .string()
    .trim()
    .min(2, 'Must be at least 2 characters')
    .max(64, 'Must be at most 64 characters'),
  ip: z
    .string()
    .trim()
    .min(1, 'Required')
    .regex(
      /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/,
      'Enter a valid IPv4 address',
    ),
  deviceRole: z.enum(['standalone', 'master', 'slave'], {
    required_error: 'Required',
  }),
  status: z.enum(['Active', 'Inactive', 'Maintenance', 'offline'], {
    required_error: 'Required',
  }),
  serialNo: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(64, 'Must be at most 64 characters'),
  macId: z
    .string()
    .trim()
    .min(1, 'Required')
    .regex(
      /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
      'Enter a valid MAC address (e.g. AA:BB:CC:DD:EE:FF)',
    ),
  manufacturingDate: z.string().min(1, 'Required'),
});

type DeviceFormInput = z.infer<typeof deviceSchema>;

const emptyDevice = (
  setupRole?: string,
): DeviceFormInput => ({
  deviceName: '',
  ip: '',
  deviceRole:
    setupRole === 'master' || setupRole === 'slave'
      ? (setupRole as DeviceRegistrationRole)
      : 'standalone',
  status: 'Active',
  serialNo: '',
  macId: '',
  manufacturingDate: '',
});

type DeviceFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export const DeviceForm = ({ onBack, onSuccess }: DeviceFormProps) => {
  const resetRef = useRef<UseFormReturn<DeviceFormInput>['reset'] | null>(
    null,
  );
  const setup = readSetupState();
  const company = setup.company;
  const branch = setup.companyBranch;
  const defaults = emptyDevice(setup.role);

  if (!company?.companyId || !branch?.branchId) {
    return null;
  }

  return (
    <>
      <p className="mb-6 text-sm text-slate-600">
        Register this device for {company.companyName} / {branch.branchName}.
      </p>

      <Form
        schema={deviceSchema}
        onSubmit={(values: DeviceFormInput) => {
          writeSetupState({
            device: {
              deviceId: createDeviceId(),
              companyId: company.companyId,
              branchId: branch.branchId,
              deviceName: values.deviceName,
              ip: values.ip,
              deviceRole: values.deviceRole,
              status: values.status,
              serialNo: values.serialNo,
              macId: values.macId,
              manufacturingDate: values.manufacturingDate,
            },
          });
          resetRef.current?.(defaults);
          onSuccess();
        }}
        options={{
          defaultValues: defaults,
        }}
      >
        {({ register, formState, reset }) => {
          resetRef.current = reset;

          return (
            <div className="space-y-4">
              <Input
                label="Device Name"
                error={formState.errors['deviceName']}
                registration={register('deviceName')}
              />
              <Input
                label="IP Address"
                error={formState.errors['ip']}
                registration={register('ip')}
                placeholder="192.168.1.10"
              />
              <Select
                label="Device Role"
                error={formState.errors['deviceRole']}
                registration={register('deviceRole')}
                options={[...DEVICE_ROLES]}
              />
              <Select
                label="Status"
                error={formState.errors['status']}
                registration={register('status')}
                options={[...DEVICE_STATUSES]}
              />
              <Input
                label="Serial No."
                error={formState.errors['serialNo']}
                registration={register('serialNo')}
              />
              <Input
                label="MAC ID"
                error={formState.errors['macId']}
                registration={register('macId')}
                placeholder="AA:BB:CC:DD:EE:FF"
              />
              <Input
                type="date"
                label="Manufacturing Date"
                error={formState.errors['manufacturingDate']}
                registration={register('manufacturingDate')}
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </div>
          );
        }}
      </Form>
    </>
  );
};
