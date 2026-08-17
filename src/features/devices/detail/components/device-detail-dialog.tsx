import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import { DeviceDetailPage } from '@/features/devices/detail/components/device-detail-page';

type DeviceDetailDialogProps = {
  device: AdoptedDevice | null;
  open: boolean;
  onClose: () => void;
  onSwitchDevice: (device: AdoptedDevice) => void;
};

export const DeviceDetailDialog = ({
  device,
  open,
  onClose,
  onSwitchDevice,
}: DeviceDetailDialogProps) => {
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

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close device details"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${device.name} details`}
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <DeviceDetailPage
            device={device}
            onClose={onClose}
            onSwitchDevice={onSwitchDevice}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
};
