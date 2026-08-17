import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import {
  AddCameraForm,
  type AddCameraInput,
} from '@/features/cameras/add/components/add-camera-form';

type AddCameraDialogProps = {
  open: boolean;
  initialName?: string;
  initialCompanyDeviceId?: string;
  devices: { companyDeviceId: string; name: string }[];
  onClose: () => void;
  onSave: (values: AddCameraInput) => void;
};

export const AddCameraDialog = ({
  open,
  initialName,
  initialCompanyDeviceId,
  devices,
  onClose,
  onSave,
}: AddCameraDialogProps) => {
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

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close add camera dialog"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-camera-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id="add-camera-title"
              className="text-base font-semibold text-slate-900"
            >
              Add camera
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Set the camera identity and placement, then add at least one live
              stream.
            </p>
          </div>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <AddCameraForm
            key={`${initialName}-${initialCompanyDeviceId}`}
            initialName={initialName}
            initialCompanyDeviceId={initialCompanyDeviceId}
            devices={devices}
            onBack={onClose}
            onSave={onSave}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
};
