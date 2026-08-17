import { Button } from '@/components/ui/button';
import type { DeviceRole } from '@/features/devices/adopted/components/adopted-devices';

export type DiscoveredDevice = {
  id: string;
  name: string;
  ip: string;
  deviceRole: DeviceRole;
  serialNo: string;
  macId: string;
  hidden: boolean;
};

type DiscoverDevicesProps = {
  devices: DiscoveredDevice[];
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
  scanLabel: string;
  scanPercent: number;
  foundCount: number;
  elapsed: string;
  ipRange: string;
  isScanning: boolean;
  onScan: () => void;
  onAddDevice: (device: DiscoveredDevice) => void;
  onToggleHidden: (id: string) => void;
};

export const DiscoverDevices = ({
  devices,
  showHidden,
  onShowHiddenChange,
  scanLabel,
  scanPercent,
  foundCount,
  elapsed,
  ipRange,
  isScanning,
  onScan,
  onAddDevice,
  onToggleHidden,
}: DiscoverDevicesProps) => {
  const visible = devices.filter((d) => showHidden || !d.hidden);
  const hiddenCount = devices.filter((d) => d.hidden).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Discover Devices
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Scan your network to discover available devices.
          </p>
        </div>
        <Button type="button" onClick={onScan} disabled={isScanning}>
          Scan Network
        </Button>
      </header>

      <div className="space-y-4 border-b border-slate-200 px-5 py-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-slate-600">{scanLabel}</span>
            <strong className="text-slate-900">{scanPercent}%</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${scanPercent}%` }}
            />
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="block text-xs text-slate-500">IP range</span>
            <strong className="text-slate-900">{ipRange}</strong>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="block text-xs text-slate-500">Found</span>
            <strong className="text-slate-900">{foundCount}</strong>
          </li>
          <li className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="block text-xs text-slate-500">Elapsed</span>
            <strong className="text-slate-900">{elapsed}</strong>
          </li>
        </ul>
      </div>

      <div className="px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Discovered Devices
          </h3>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Show Hidden Devices
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => onShowHiddenChange(e.target.checked)}
              className="size-4 rounded border-slate-300"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Device Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">IP</th>
                <th className="px-4 py-2">Serial No.</th>
                <th className="px-4 py-2">MAC ID</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No devices found
                  </td>
                </tr>
              ) : (
                visible.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {device.name}
                      {device.hidden ? (
                        <span className="ml-2 text-xs text-slate-400">
                          (hidden)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">
                      {device.deviceRole}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {device.ip}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {device.serialNo}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {device.macId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onAddDevice(device)}
                        >
                          Add Device
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleHidden(device.id)}
                        >
                          {device.hidden ? 'Unhide' : 'Hide'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <span>Showing {visible.length} devices</span>
          <span>Hide {hiddenCount} devices</span>
        </footer>
      </div>
    </section>
  );
};
