import { Eye, MoreHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export type DeviceRole = 'standalone' | 'master' | 'slave';
export type DeviceStatus = 'Active' | 'Inactive' | 'Maintenance' | 'offline';

export type AdoptedDevice = {
  id: string;
  companyId: string;
  branchId: string;
  companyDeviceId: string;
  name: string;
  ip: string;
  dnsName: string;
  deviceRole: DeviceRole;
  status: DeviceStatus;
  approvalStatus: string;
  serialNo: string;
  macId: string;
  manufacturingDate: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  isSystemRecord: boolean;
  isDeleted: boolean;
};

type AdoptedDevicesProps = {
  devices: AdoptedDevice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenDetails: (device: AdoptedDevice) => void;
  onOpenDevice: (device: AdoptedDevice) => void;
  onAdd: () => void;
  onDelete: (device: AdoptedDevice) => void;
};

const statusClass: Record<DeviceStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Maintenance: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  offline: 'bg-red-50 text-red-700 ring-red-600/20',
};

export const AdoptedDevices = ({
  devices,
  selectedId,
  onSelect,
  onOpenDetails,
  onOpenDevice,
  onAdd,
  onDelete,
}: AdoptedDevicesProps) => {
  const selectedDevice =
    devices.find((device) => device.id === selectedId) ?? null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Adopted Devices
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            List of added devices.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (selectedDevice) onOpenDevice(selectedDevice);
            }}
            disabled={!selectedDevice}
          >
            Open Device
          </Button>
          <Button type="button" onClick={onAdd}>
            + Add Device
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!selectedDevice}
            onClick={() => {
              if (selectedDevice) onDelete(selectedDevice);
            }}
          >
            Delete
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Device Name</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">IP</th>
              <th className="px-5 py-3">Serial No.</th>
              <th className="px-5 py-3">MAC ID</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {devices.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  No devices yet. Add a device before adding cameras.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
              <tr
                key={device.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-slate-50',
                  selectedId === device.id && 'bg-slate-50',
                )}
                onClick={() => {
                  onSelect(device.id);
                  onOpenDetails(device);
                }}
              >
                <td className="px-5 py-3 font-medium text-slate-900">
                  {device.name}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                      statusClass[device.status],
                    )}
                  >
                    {device.status}
                  </span>
                </td>
                <td className="px-5 py-3 capitalize text-slate-700">
                  {device.deviceRole}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-700">
                  {device.ip}
                </td>
                <td className="px-5 py-3 text-slate-700">{device.serialNo}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-700">
                  {device.macId}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDevice(device);
                      }}
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(device);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="More"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(device.id);
                        onOpenDetails(device);
                      }}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
        Showing 1 to {devices.length} of {devices.length} devices
      </footer>
    </section>
  );
};
