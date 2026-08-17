import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useAdoptedDevices } from '@/features/devices/adopted/api/get-adopted-devices';
import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import {
  useCameraAssignments,
  useCamerasForAssignment,
  useCreateCameraAssignment,
  useDeleteCameraAssignment,
  useUpdateCameraAssignment,
} from '@/features/devices/detail/api/camera-assignments';
import {
  useDeviceHealth,
  useIngestDeviceHealth,
} from '@/features/devices/detail/api/get-device-health';
import {
  useCreateModelSubscription,
  useModelSubscriptions,
  useUpdateModelSubscription,
} from '@/features/devices/detail/api/model-subscriptions';
import { cn } from '@/utils/cn';

type DeviceDetailPageProps = {
  device: AdoptedDevice;
  onClose?: () => void;
  onSwitchDevice?: (device: AdoptedDevice) => void;
};

const stubActions = ['Refresh', 'Restart', 'Diagnose'] as const;

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

const UsageBar = ({
  label,
  value,
  unit = '%',
}: {
  label: string;
  value: number;
  unit?: string;
}) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-lg font-semibold tracking-tight text-slate-900">
        {value.toFixed(1)}
        <span className="ml-0.5 text-xs font-medium text-slate-500">
          {unit}
        </span>
      </p>
    </div>
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
      <div
        className="h-full rounded-full bg-slate-800"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <li className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
    <span className="shrink-0 text-slate-500">{label}</span>
    <strong className="break-all text-right font-medium capitalize text-slate-900">
      {value}
    </strong>
  </li>
);

export const DeviceDetailPage = ({
  device,
  onClose,
  onSwitchDevice,
}: DeviceDetailPageProps) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const devicesQuery = useAdoptedDevices();
  const healthQuery = useDeviceHealth({ deviceId: device.id });
  const ingestHealth = useIngestDeviceHealth();
  const subscriptionsQuery = useModelSubscriptions({ deviceId: device.id });
  const assignmentsQuery = useCameraAssignments({ deviceId: device.id });
  const camerasQuery = useCamerasForAssignment();
  const createSubscription = useCreateModelSubscription();
  const updateSubscription = useUpdateModelSubscription();
  const createAssignment = useCreateCameraAssignment();
  const updateAssignment = useUpdateCameraAssignment();
  const deleteAssignment = useDeleteCameraAssignment();

  const devices = devicesQuery.data ?? [];
  const deviceOptions = devices.some((item) => item.id === device.id)
    ? devices
    : [device, ...devices];
  const health = healthQuery.data;

  const handleBack = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(paths.app.devices.getHref());
  };

  const switchDevice = (nextId: string) => {
    if (nextId === device.id) return;
    const next = deviceOptions.find((item) => item.id === nextId);
    if (!next) return;
    if (onSwitchDevice) {
      onSwitchDevice(next);
      return;
    }
    navigate(paths.app.deviceDetail.getHref(next.id), { replace: true });
  };

  return (
    <div className="space-y-4 p-5 pr-12 sm:p-6 sm:pr-14">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Back to devices"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
          Device analytics
        </p>
        <div className="relative min-w-0 max-w-full flex-1 sm:max-w-xs">
          <label htmlFor="device-select" className="sr-only">
            Select device
          </label>
          <select
            id="device-select"
            value={device.id}
            onChange={(e) => switchDevice(e.target.value)}
            className="w-full appearance-none truncate rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-9 text-sm font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          >
            {deviceOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-slate-900">
                {device.name}
              </h2>
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-medium',
                  device.status === 'Active' &&
                    'bg-emerald-50 text-emerald-700',
                  device.status === 'Inactive' && 'bg-slate-100 text-slate-600',
                  device.status === 'Maintenance' &&
                    'bg-amber-50 text-amber-700',
                  device.status === 'offline' && 'bg-red-50 text-red-700',
                )}
              >
                {device.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {device.ip} ·{' '}
              <span className="capitalize">{device.deviceRole}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stubActions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  addNotification({
                    type: 'info',
                    title: label,
                    message: 'Stub action for now.',
                  })
                }
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {healthQuery.isLoading ? (
        <div className="flex justify-center rounded-xl border border-slate-200 py-10">
          <Spinner size="lg" />
        </div>
      ) : health ? (
        <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <UsageBar label="CPU usage" value={health.cpuUsage} />
          <UsageBar label="NPU usage" value={health.npuUsage} />
          <UsageBar label="RAM" value={health.ram} />
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Temperature
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              {health.temperature.toFixed(1)}
              <span className="ml-0.5 text-xs font-medium text-slate-500">
                °C
              </span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">device_health</p>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          Health data unavailable
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Device</h3>
          <ul className="divide-y divide-slate-100">
            <DetailRow label="Device ID" value={device.id} />
            <DetailRow label="Company ID" value={device.companyId} />
            <DetailRow label="Branch ID" value={device.branchId} />
            <DetailRow label="IP" value={device.ip} />
            <DetailRow label="Role" value={device.deviceRole} />
            <DetailRow label="Serial no." value={device.serialNo || '—'} />
            <DetailRow label="MAC ID" value={device.macId || '—'} />
            <DetailRow
              label="Manufacturing date"
              value={formatDate(device.manufacturingDate)}
            />
            <DetailRow
              label="Created at"
              value={formatDateTime(device.createdAt)}
            />
            <DetailRow label="Created by" value={device.createdBy} />
            <DetailRow
              label="Updated at"
              value={formatDateTime(device.updatedAt)}
            />
            <DetailRow label="Updated by" value={device.updatedBy} />
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 px-4 py-3">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">
            Health record
          </h3>
          {healthQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : health ? (
            <ul className="divide-y divide-slate-100">
              <DetailRow label="Health ID" value={health.deviceHealthId} />
              <DetailRow
                label="Updated at"
                value={formatDateTime(health.updatedAt)}
              />
              <DetailRow label="Updated by" value={health.updatedBy} />
              <DetailRow
                label="Created at"
                value={formatDateTime(health.createdAt)}
              />
              <DetailRow label="Created by" value={health.createdBy} />
              <DetailRow
                label="System record"
                value={health.isSystemRecord ? 'Yes' : 'No'}
              />
              <DetailRow
                label="Deleted"
                value={health.isDeleted ? 'Yes' : 'No'}
              />
            </ul>
          ) : (
            <p className="py-6 text-sm text-slate-500">No health record</p>
          )}
          <form
            className="mt-3 grid gap-2 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const numberValue = (name: string) =>
                Number(
                  (form.elements.namedItem(name) as HTMLInputElement).value,
                );
              ingestHealth.mutate({
                deviceId: device.id,
                data: {
                  cpu_usage: numberValue('cpu_usage'),
                  npu_usage: numberValue('npu_usage'),
                  ram: numberValue('ram'),
                  temperature: numberValue('temperature'),
                },
              });
            }}
          >
            <input
              name="cpu_usage"
              type="number"
              step="0.1"
              placeholder="CPU %"
              className="h-8 rounded-md border border-slate-200 px-2 text-sm"
            />
            <input
              name="npu_usage"
              type="number"
              step="0.1"
              placeholder="NPU %"
              className="h-8 rounded-md border border-slate-200 px-2 text-sm"
            />
            <input
              name="ram"
              type="number"
              step="0.1"
              placeholder="RAM %"
              className="h-8 rounded-md border border-slate-200 px-2 text-sm"
            />
            <input
              name="temperature"
              type="number"
              step="0.1"
              placeholder="Temp °C"
              className="h-8 rounded-md border border-slate-200 px-2 text-sm"
            />
            <Button type="submit" size="sm" isLoading={ingestHealth.isPending}>
              Submit health
            </Button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Model subscriptions
        </h3>
        <ul className="divide-y divide-slate-100 text-sm">
          {(subscriptionsQuery.data ?? []).map((item) => (
            <li
              key={item.subscription_id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <span>
                {item.model_id} · {item.is_enabled ? 'enabled' : 'disabled'}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateSubscription.mutate({
                    subscriptionId: item.subscription_id,
                    data: { is_enabled: !item.is_enabled },
                  })
                }
              >
                {item.is_enabled ? 'Disable' : 'Enable'}
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const modelId = (
              form.elements.namedItem('model_id') as HTMLInputElement
            ).value.trim();
            const key = (
              form.elements.namedItem('subscription_key') as HTMLInputElement
            ).value.trim();
            if (!modelId || !key) return;
            createSubscription.mutate({
              deviceId: device.id,
              data: {
                model_id: modelId,
                subscription_key: key,
                start_date: new Date().toISOString().slice(0, 10),
              },
            });
            form.reset();
          }}
        >
          <input
            name="model_id"
            placeholder="model id (person)"
            className="h-8 flex-1 rounded-md border border-slate-200 px-2 text-sm"
          />
          <input
            name="subscription_key"
            placeholder="subscription key"
            className="h-8 flex-1 rounded-md border border-slate-200 px-2 text-sm"
          />
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">
          Camera assignments
        </h3>
        <ul className="divide-y divide-slate-100 text-sm">
          {(assignmentsQuery.data ?? []).map((item) => (
            <li
              key={item.model_assign_id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <span>
                {item.camera_id.slice(0, 8)}… · {item.status}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateAssignment.mutate({
                      assignmentId: item.model_assign_id,
                      data: {
                        status:
                          item.status === 'running' ? 'stopped' : 'running',
                      },
                    })
                  }
                >
                  {item.status === 'running' ? 'Stop' : 'Start'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteAssignment.mutate(item.model_assign_id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const cameraId = (
              form.elements.namedItem('camera_id') as HTMLSelectElement
            ).value;
            if (!cameraId) return;
            createAssignment.mutate({
              deviceId: device.id,
              data: {
                camera_id: cameraId,
                confidence_threshold: 0.5,
                start_date: new Date().toISOString().slice(0, 10),
              },
            });
          }}
        >
          <select
            name="camera_id"
            className="h-8 flex-1 rounded-md border border-slate-200 px-2 text-sm"
          >
            {(camerasQuery.data ?? []).map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm">
            Assign
          </Button>
        </form>
      </section>
    </div>
  );
};
