import { useEffect, useRef, useState } from 'react';

import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { useAddCamera } from '@/features/cameras/add/api/add-camera';
import { useCameraDevices } from '@/features/cameras/add/api/get-camera-devices';
import { AddCameraDialog } from '@/features/cameras/add/components/add-camera-dialog';
import type { AddCameraInput } from '@/features/cameras/add/components/add-camera-form';
import { useAdoptedCameras } from '@/features/cameras/adopted/api/get-adopted-cameras';
import { useDeleteCamera } from '@/features/cameras/adopted/api/delete-camera';
import {
  AdoptedCameras,
  type AdoptedCamera,
} from '@/features/cameras/adopted/components/adopted-cameras';
import { CameraDetailsDrawer } from '@/features/cameras/adopted/components/camera-details-drawer';
import { ConnectCameraForm } from '@/features/cameras/connect/components/connect-camera-form';
import { useScanNetwork } from '@/features/cameras/discover/api/scan-network';
import {
  DiscoverCameras,
  type DiscoveredCamera,
} from '@/features/cameras/discover/components/discover-cameras';
import { CameraLiveDialog } from '@/features/cameras/live/components/camera-live-dialog';

const formatElapsed = (seconds: number) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const CamerasPage = () => {
  const { addNotification } = useNotifications();
  const devicesQuery = useCameraDevices();
  const cameraDevices = devicesQuery.data ?? [];
  const [selectedCompanyDeviceId, setSelectedCompanyDeviceId] = useState('');
  const adoptedQuery = useAdoptedCameras({
    companyDeviceId: selectedCompanyDeviceId || undefined,
    queryConfig: { enabled: Boolean(selectedCompanyDeviceId) },
  });
  const scanNetwork = useScanNetwork();
  const addCamera = useAddCamera();
  const deleteCamera = useDeleteCamera();

  const cameras = adoptedQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsCamera, setDetailsCamera] = useState<AdoptedCamera | null>(
    null,
  );
  const [liveCamera, setLiveCamera] = useState<AdoptedCamera | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [devices, setDevices] = useState<DiscoveredCamera[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [scanLabel, setScanLabel] = useState('Idle');
  const [scanPercent, setScanPercent] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [ipRange, setIpRange] = useState('192.168.1.1 – 255');
  const [isScanning, setIsScanning] = useState(false);
  const [connectDevice, setConnectDevice] = useState<DiscoveredCamera | null>(
    null,
  );
  const [addDefaults, setAddDefaults] = useState({
    name: '',
  });

  const scanTimer = useRef<number | null>(null);
  const elapsedTimer = useRef<number | null>(null);

  useEffect(() => {
    if (selectedCompanyDeviceId) return;
    const firstDeviceId = cameraDevices[0]?.companyDeviceId;
    if (firstDeviceId) {
      setSelectedCompanyDeviceId(firstDeviceId);
    }
  }, [cameraDevices, selectedCompanyDeviceId]);

  useEffect(() => {
    setSelectedId(null);
  }, [selectedCompanyDeviceId]);

  useEffect(() => {
    const firstCameraId = adoptedQuery.data?.[0]?.id;
    if (!selectedId && firstCameraId) {
      setSelectedId(firstCameraId);
    }
  }, [adoptedQuery.data, selectedId]);

  const clearScanTimers = () => {
    if (scanTimer.current) window.clearInterval(scanTimer.current);
    if (elapsedTimer.current) window.clearInterval(elapsedTimer.current);
    scanTimer.current = null;
    elapsedTimer.current = null;
  };

  useEffect(() => () => clearScanTimers(), []);

  const openAdd = (defaults?: { name: string }) => {
    if (cameraDevices.length === 0) {
      addNotification({
        type: 'error',
        title: 'Add a device first',
        message: 'Cameras are attached to a device. Add a device, then add cameras.',
      });
      return;
    }
    setAddDefaults(defaults ?? { name: '' });
    setAddOpen(true);
  };

  const startScan = () => {
    clearScanTimers();
    setIsScanning(true);
    setScanLabel('Scanning');
    setScanPercent(0);
    setFoundCount(0);
    setElapsedSec(0);
    setDevices([]);

    elapsedTimer.current = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);

    let pct = 0;
    scanTimer.current = window.setInterval(() => {
      pct = Math.min(pct + 10, 90);
      setScanPercent(pct);
    }, 200);

    scanNetwork.mutate(
      {},
      {
        onSuccess: (result) => {
          clearScanTimers();
          setDevices(result.devices);
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

  const handleSave = (values: AddCameraInput) => {
    addCamera.mutate(values, {
      onSuccess: (camera) => {
        setSelectedId(camera.id);
        addNotification({
          type: 'success',
          title: 'Camera saved',
          message: `${camera.name} was added.`,
        });
        setAddOpen(false);
      },
    });
  };

  const handleDelete = (camera: AdoptedCamera) => {
    if (!window.confirm(`Delete ${camera.name}?`)) return;
    deleteCamera.mutate(camera.id, {
      onSuccess: () => {
        if (selectedId === camera.id) setSelectedId(null);
        if (detailsCamera?.id === camera.id) setDetailsCamera(null);
        addNotification({
          type: 'success',
          title: 'Camera deleted',
          message: `${camera.name} was removed.`,
        });
      },
    });
  };

  if (devicesQuery.isLoading || adoptedQuery.isLoading) {
    return (
      <div className="flex justify-center px-6 py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 sm:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Cameras
          </p>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Camera list
          </h1>
        </div>
        <label className="block min-w-[220px] text-sm">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Device
          </span>
          <select
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
            value={selectedCompanyDeviceId}
            disabled={cameraDevices.length === 0}
            onChange={(e) => setSelectedCompanyDeviceId(e.target.value)}
          >
            {cameraDevices.length === 0 ? (
              <option value="">No devices — add one first</option>
            ) : (
              cameraDevices.map((device) => (
                <option
                  key={device.companyDeviceId}
                  value={device.companyDeviceId}
                >
                  {device.name}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      <div className="space-y-6">
        <AdoptedCameras
          cameras={cameras}
          selectedId={selectedId}
          canAdd={cameraDevices.length > 0}
          emptyMessage={
            cameraDevices.length === 0
              ? 'Add a device first. Cameras are listed on the device they belong to.'
              : 'No cameras on this device yet.'
          }
          onSelect={setSelectedId}
          onOpenDetails={setDetailsCamera}
          onOpenCamera={setLiveCamera}
          onAdd={() => openAdd()}
          onDelete={handleDelete}
        />
        <DiscoverCameras
          devices={devices}
          showHidden={showHidden}
          onShowHiddenChange={setShowHidden}
          scanLabel={scanLabel}
          scanPercent={scanPercent}
          foundCount={foundCount}
          elapsed={formatElapsed(elapsedSec)}
          ipRange={ipRange}
          isScanning={isScanning || scanNetwork.isPending}
          onScan={startScan}
          onConnect={setConnectDevice}
          onToggleHidden={(id) =>
            setDevices((prev) =>
              prev.map((d) =>
                d.id === id ? { ...d, hidden: !d.hidden } : d,
              ),
            )
          }
        />
      </div>

      <CameraDetailsDrawer
        camera={detailsCamera}
        open={Boolean(detailsCamera)}
        onClose={() => setDetailsCamera(null)}
        onDeleted={() => setDetailsCamera(null)}
      />

      <ConnectCameraForm
        open={Boolean(connectDevice)}
        deviceId={connectDevice?.id ?? ''}
        deviceName={connectDevice?.name ?? ''}
        onCancel={() => setConnectDevice(null)}
        onContinue={() => {
          if (!connectDevice) return;
          const next = {
            name: connectDevice.name,
          };
          setConnectDevice(null);
          openAdd(next);
        }}
      />

      <AddCameraDialog
        open={addOpen}
        initialName={addDefaults.name}
        initialCompanyDeviceId={selectedCompanyDeviceId}
        devices={cameraDevices}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
      />

      <CameraLiveDialog
        open={Boolean(liveCamera)}
        camera={liveCamera}
        onClose={() => setLiveCamera(null)}
        onSwitchCamera={setLiveCamera}
      />
    </div>
  );
};
