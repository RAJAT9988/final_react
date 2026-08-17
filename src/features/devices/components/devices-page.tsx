import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { useAddDevice } from '@/features/devices/add/api/add-device';
import { AddDeviceDialog } from '@/features/devices/add/components/add-device-dialog';
import type { AddDeviceInput } from '@/features/devices/add/components/add-device-form';
import { useDeleteDevice } from '@/features/devices/adopted/api/delete-device';
import {
  useApproveDevice,
  useRejectDevice,
} from '@/features/devices/adopted/api/device-actions';
import { useAdoptedDevices } from '@/features/devices/adopted/api/get-adopted-devices';
import { usePendingDevices } from '@/features/devices/adopted/api/get-pending-devices';
import {
  AdoptedDevices,
  type AdoptedDevice,
  type DeviceRole,
} from '@/features/devices/adopted/components/adopted-devices';
import { DeviceDetailsDrawer } from '@/features/devices/adopted/components/device-details-drawer';
import { DeviceDetailDialog } from '@/features/devices/detail/components/device-detail-dialog';
import { useScanDevices } from '@/features/devices/discover/api/scan-devices';
import {
  DiscoverDevices,
  type DiscoveredDevice,
} from '@/features/devices/discover/components/discover-devices';

const formatElapsed = (seconds: number) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

type AddDefaults = {
  name: string;
  ip: string;
  deviceRole: DeviceRole;
  serialNo: string;
  macId: string;
};

const emptyAddDefaults: AddDefaults = {
  name: '',
  ip: '',
  deviceRole: 'standalone',
  serialNo: '',
  macId: '',
};

export const DevicesPage = () => {
  const { addNotification } = useNotifications();
  const adoptedQuery = useAdoptedDevices();
  const scanDevices = useScanDevices();
  const addDevice = useAddDevice();
  const deleteDevice = useDeleteDevice();
  const approveDevice = useApproveDevice();
  const rejectDevice = useRejectDevice();
  const branchId = adoptedQuery.data?.[0]?.branchId ?? '';
  const pendingQuery = usePendingDevices({ branchId });

  const devices = adoptedQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsDevice, setDetailsDevice] = useState<AdoptedDevice | null>(
    null,
  );
  const [openDevice, setOpenDevice] = useState<AdoptedDevice | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredDevice[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [scanLabel, setScanLabel] = useState('Idle');
  const [scanPercent, setScanPercent] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [ipRange, setIpRange] = useState('192.168.1.1 – 255');
  const [isScanning, setIsScanning] = useState(false);
  const [addDefaults, setAddDefaults] = useState<AddDefaults>(emptyAddDefaults);

  const scanTimer = useRef<number | null>(null);
  const elapsedTimer = useRef<number | null>(null);

  useEffect(() => {
    const firstDeviceId = adoptedQuery.data?.[0]?.id;
    if (!selectedId && firstDeviceId) {
      setSelectedId(firstDeviceId);
    }
  }, [adoptedQuery.data, selectedId]);

  const clearScanTimers = () => {
    if (scanTimer.current) window.clearInterval(scanTimer.current);
    if (elapsedTimer.current) window.clearInterval(elapsedTimer.current);
    scanTimer.current = null;
    elapsedTimer.current = null;
  };

  useEffect(() => () => clearScanTimers(), []);

  const openAdd = (defaults?: Partial<AddDefaults>) => {
    setAddDefaults({ ...emptyAddDefaults, ...defaults });
    setAddOpen(true);
  };

  const startScan = () => {
    clearScanTimers();
    setIsScanning(true);
    setScanLabel('Scanning');
    setScanPercent(0);
    setFoundCount(0);
    setElapsedSec(0);
    setDiscovered([]);

    elapsedTimer.current = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);

    let pct = 0;
    scanTimer.current = window.setInterval(() => {
      pct = Math.min(pct + 10, 90);
      setScanPercent(pct);
    }, 200);

    scanDevices.mutate(
      {},
      {
        onSuccess: (result) => {
          clearScanTimers();
          setDiscovered(result.devices);
          setFoundCount(result.devices.length);
          setIpRange(result.ipRange);
          setScanPercent(100);
          setScanLabel('Complete');
          setIsScanning(false);
        },
        onError: () => {
          clearScanTimers();
          setScanPercent(0);
          setScanLabel('Failed');
          setIsScanning(false);
        },
      },
    );
  };

  const handleSave = (values: AddDeviceInput) => {
    addDevice.mutate(values, {
      onSuccess: (device) => {
        setSelectedId(device.id);
        addNotification({
          type: 'success',
          title:
            device.approvalStatus === 'pending_approval'
              ? 'Device pending approval'
              : 'Device saved',
          message:
            device.approvalStatus === 'pending_approval'
              ? `${device.name} was registered and is waiting for approval.`
              : `${device.name} was added.`,
        });
        setAddOpen(false);
      },
    });
  };

  const handleDelete = (device: AdoptedDevice) => {
    if (!window.confirm(`Delete ${device.name}?`)) return;
    deleteDevice.mutate(device.id, {
      onSuccess: () => {
        if (selectedId === device.id) setSelectedId(null);
        if (detailsDevice?.id === device.id) setDetailsDevice(null);
        addNotification({
          type: 'success',
          title: 'Device deleted',
          message: `${device.name} was removed.`,
        });
      },
    });
  };

  if (adoptedQuery.isLoading) {
    return (
      <div className="flex justify-center px-6 py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:px-8">
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Devices
          </p>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Device list
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        <AdoptedDevices
          devices={devices}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onOpenDetails={setDetailsDevice}
          onOpenDevice={setOpenDevice}
          onAdd={() => openAdd()}
          onDelete={handleDelete}
        />
        {(pendingQuery.data ?? []).length > 0 ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Pending approval
            </h2>
            <ul className="mt-3 space-y-2">
              {(pendingQuery.data ?? []).map((device) => (
                <li
                  key={device.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {device.name} · {device.ip}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => approveDevice.mutate(device.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => rejectDevice.mutate(device.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <DiscoverDevices
          devices={discovered}
          showHidden={showHidden}
          onShowHiddenChange={setShowHidden}
          scanLabel={scanLabel}
          scanPercent={scanPercent}
          foundCount={foundCount}
          elapsed={formatElapsed(elapsedSec)}
          ipRange={ipRange}
          isScanning={isScanning || scanDevices.isPending}
          onScan={startScan}
          onAddDevice={(device) =>
            openAdd({
              name: device.name,
              ip: device.ip,
              deviceRole: device.deviceRole,
              serialNo: device.serialNo,
              macId: device.macId,
            })
          }
          onToggleHidden={(id) =>
            setDiscovered((prev) =>
              prev.map((d) => (d.id === id ? { ...d, hidden: !d.hidden } : d)),
            )
          }
        />
      </div>

      <DeviceDetailsDrawer
        device={detailsDevice}
        open={Boolean(detailsDevice)}
        onClose={() => setDetailsDevice(null)}
        onDeleted={() => setDetailsDevice(null)}
      />

      <AddDeviceDialog
        open={addOpen}
        initialName={addDefaults.name}
        initialIp={addDefaults.ip}
        initialDeviceRole={addDefaults.deviceRole}
        initialSerialNo={addDefaults.serialNo}
        initialMacId={addDefaults.macId}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
      />

      <DeviceDetailDialog
        open={Boolean(openDevice)}
        device={openDevice}
        onClose={() => setOpenDevice(null)}
        onSwitchDevice={setOpenDevice}
      />
    </div>
  );
};
