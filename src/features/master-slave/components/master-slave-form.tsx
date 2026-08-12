import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { writeSetupState, type DeviceRole } from '@/features/setup/config';
import { cn } from '@/utils/cn';

type MasterSlaveFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export const MasterSlaveForm = ({
  onBack,
  onSuccess,
}: MasterSlaveFormProps) => {
  // Always start with no selection so older choices are not shown
  const [role, setRole] = useState<DeviceRole | undefined>(undefined);

  return (
    <>
      <p className="mb-6 text-sm text-gray-600">
        Choose how this device should run in your setup.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setRole('master')}
          className={cn(
            'rounded-lg border-2 p-6 text-left transition',
            role === 'master'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-400',
          )}
        >
          <p className="text-lg font-semibold text-slate-900">Master</p>
          <p className="mt-2 text-sm text-slate-600">
            Primary device that manages cameras and connected slaves.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setRole('slave')}
          className={cn(
            'rounded-lg border-2 p-6 text-left transition',
            role === 'slave'
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 hover:border-slate-400',
          )}
        >
          <p className="text-lg font-semibold text-slate-900">Slave</p>
          <p className="mt-2 text-sm text-slate-600">
            Secondary device that follows the master configuration.
          </p>
        </button>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          disabled={!role}
          onClick={() => {
            if (!role) return;
            writeSetupState({ role });
            onSuccess();
          }}
        >
          Continue
        </Button>
      </div>
    </>
  );
};
