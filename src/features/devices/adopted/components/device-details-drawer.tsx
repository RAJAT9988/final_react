import { LayoutGrid, Puzzle, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { useDeleteDevice } from '@/features/devices/adopted/api/delete-device';
import {
  useApproveDevice,
  useReassignDevice,
  useRejectDevice,
} from '@/features/devices/adopted/api/device-actions';
import { useDeviceBranches } from '@/features/devices/adopted/api/get-device-branches';
import { useUpdateDevice } from '@/features/devices/adopted/api/update-device';
import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import { cn } from '@/utils/cn';

type DrawerTab = 'overview' | 'settings' | 'plugins';

type DeviceDetailsDrawerProps = {
  device: AdoptedDevice | null;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
};

const tabs: { id: DrawerTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
];

const statusClass = {
  Active: 'bg-emerald-500/15 text-emerald-700',
  Inactive: 'bg-slate-200/80 text-slate-700',
  Maintenance: 'bg-amber-500/15 text-amber-700',
  offline: 'bg-red-500/15 text-red-700',
} as const;

const formatDate = (value: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatDateTime = (value: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const deviceSettingsSchema = z.object({
  name: z.string().trim().min(1, 'Required'),
  ip: z.string().trim().min(1, 'Required'),
  dnsName: z.string().optional(),
  deviceRole: z.enum(['standalone', 'master', 'slave']),
  status: z.enum(['Active', 'Inactive', 'Maintenance', 'offline']),
});

type DeviceSettingsFields = z.infer<typeof deviceSettingsSchema>;

export const DeviceDetailsDrawer = ({
  device,
  open,
  onClose,
  onDeleted,
}: DeviceDetailsDrawerProps) => {
  const { addNotification } = useNotifications();
  const [tab, setTab] = useState<DrawerTab>('overview');
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const approveDevice = useApproveDevice();
  const rejectDevice = useRejectDevice();
  const reassignDevice = useReassignDevice();
  const branchesQuery = useDeviceBranches({
    companyId: device?.companyId ?? '',
  });
  const [branchId, setBranchId] = useState(device?.branchId ?? '');

  useEffect(() => {
    if (!open || !device) return;
    setTab('overview');
    setBranchId(device.branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when a different device is opened
  }, [open, device?.id, device?.branchId]);

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

  if (!open || !device) return null;

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Device ID', value: device.id },
    { label: 'Company ID', value: device.companyId },
    { label: 'Branch ID', value: device.branchId },
    { label: 'Device name', value: device.name },
    { label: 'IP', value: device.ip },
    { label: 'DNS', value: device.dnsName || '—' },
    { label: 'Device role', value: device.deviceRole },
    { label: 'Approval', value: device.approvalStatus || '—' },
    { label: 'Serial no.', value: device.serialNo || '—' },
    { label: 'MAC ID', value: device.macId || '—' },
    {
      label: 'Manufacturing date',
      value: formatDate(device.manufacturingDate),
    },
    { label: 'Created at', value: formatDateTime(device.createdAt) },
    { label: 'Created by', value: device.createdBy },
    { label: 'Updated at', value: formatDateTime(device.updatedAt) },
    { label: 'Updated by', value: device.updatedBy },
    {
      label: 'System record',
      value: device.isSystemRecord ? 'Yes' : 'No',
    },
    { label: 'Deleted', value: device.isDeleted ? 'Yes' : 'No' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close device details"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-drawer-title"
        className="absolute inset-y-0 right-0 flex h-dvh w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-slate-200">
          <header className="flex items-center gap-3 px-5 py-4">
            <h2
              id="device-drawer-title"
              className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900"
            >
              {device.name}
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {device.name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-600">
                      {device.ip}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                      statusClass[device.status],
                    )}
                  >
                    {device.status}
                  </span>
                </div>
                <p className="mt-3 text-xs capitalize text-slate-500">
                  Role: {device.deviceRole}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Device
                </p>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {rows.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span className="shrink-0 text-slate-500">
                        {row.label}
                      </span>
                      <strong className="break-all text-right text-slate-900">
                        {row.value}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {tab === 'settings' ? (
            <div className="space-y-5">
              <Form
                key={device.id}
                schema={deviceSettingsSchema}
                options={{
                  defaultValues: {
                    name: device.name,
                    ip: device.ip,
                    dnsName: device.dnsName,
                    deviceRole: device.deviceRole,
                    status: device.status,
                  },
                }}
                onSubmit={(values: DeviceSettingsFields) => {
                  updateDevice.mutate({
                    deviceId: device.id,
                    data: {
                      device_name: values.name.trim(),
                      ip: values.ip.trim(),
                      dns_name: values.dnsName?.trim() || null,
                      device_role: values.deviceRole,
                      status: values.status,
                    },
                  });
                }}
              >
                {({ register, formState }) => (
                  <div className="space-y-4">
                    <Input
                      label="Device name"
                      error={formState.errors['name']}
                      registration={register('name')}
                    />
                    <Input
                      label="IP"
                      error={formState.errors['ip']}
                      registration={register('ip')}
                    />
                    <Input
                      label="DNS name"
                      error={formState.errors['dnsName']}
                      registration={register('dnsName')}
                    />
                    <Select
                      label="Role"
                      error={formState.errors['deviceRole']}
                      registration={register('deviceRole')}
                      options={[
                        { label: 'standalone', value: 'standalone' },
                        { label: 'master', value: 'master' },
                        { label: 'slave', value: 'slave' },
                      ]}
                    />
                    <Select
                      label="Status"
                      error={formState.errors['status']}
                      registration={register('status')}
                      options={[
                        { label: 'Active', value: 'Active' },
                        { label: 'Inactive', value: 'Inactive' },
                        { label: 'Maintenance', value: 'Maintenance' },
                        { label: 'offline', value: 'offline' },
                      ]}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={updateDevice.isPending}
                    >
                      Save settings
                    </Button>
                  </div>
                )}
              </Form>

              {device.approvalStatus === 'pending_approval' ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    isLoading={approveDevice.isPending}
                    onClick={() => approveDevice.mutate(device.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    isLoading={rejectDevice.isPending}
                    onClick={() => rejectDevice.mutate(device.id)}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Reassign branch
                </p>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                >
                  {(branchesQuery.data ?? []).map((branch) => (
                    <option key={branch.branchId} value={branch.branchId}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!branchId || branchId === device.branchId}
                  isLoading={reassignDevice.isPending}
                  onClick={() =>
                    reassignDevice.mutate(
                      { deviceId: device.id, branchId },
                      {
                        onSuccess: () =>
                          addNotification({
                            type: 'success',
                            title: 'Device reassigned',
                            message:
                              'The device was moved to the selected branch.',
                          }),
                      },
                    )
                  }
                >
                  Reassign
                </Button>
              </div>

              <Button
                type="button"
                variant="destructive"
                className="w-full"
                isLoading={deleteDevice.isPending}
                onClick={() => {
                  if (!window.confirm(`Delete ${device.name}?`)) return;
                  deleteDevice.mutate(device.id, {
                    onSuccess: () => {
                      addNotification({
                        type: 'success',
                        title: 'Device deleted',
                        message: `${device.name} was removed.`,
                      });
                      onDeleted?.();
                      onClose();
                    },
                  });
                }}
              >
                Delete device
              </Button>
            </div>
          ) : null}
          {tab === 'plugins' ? (
            <p className="text-sm text-slate-600">
              Plugins for this device will go here.
            </p>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  );
};
