import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentDevice } from '@/features/device/api/get-current-device';
import { completeSetupStep } from '@/features/setup/config';

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  if (!value) return null;

  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="break-all text-right text-sm font-medium text-slate-900">
        {value}
      </strong>
    </div>
  );
};

type CurrentDeviceProps = {
  onContinue: () => void;
};

export const CurrentDevice = ({ onContinue }: CurrentDeviceProps) => {
  const query = useCurrentDevice();
  const device = query.data;

  const handleContinue = () => {
    if (!device) return;

    completeSetupStep('device', {
      device: {
        deviceId: device.id,
        companyId: '',
        branchId: '',
        deviceName: device.name,
        ip: device.ip,
        deviceRole: device.deviceRole,
        status: device.status,
        serialNo: device.serialNo,
        macId: device.macId,
        manufacturingDate: '',
      },
    });
    onContinue();
  };

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Could not load this device. Check the connection and try again.
        </p>
        <Button type="button" variant="outline" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Welcome. This is the device you are setting up.
        </p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
          {device.name}
        </h2>
      </div>

      <div className="divide-y divide-slate-100 border-y border-slate-100">
        <InfoRow label="Device name" value={device.name} />
        <InfoRow label="IP address" value={device.ip} />
        <InfoRow label="Serial no." value={device.serialNo} />
        <InfoRow label="MAC ID" value={device.macId} />
      </div>

      <Button type="button" onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
};
