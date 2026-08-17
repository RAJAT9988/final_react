import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import { CameraLivePage } from '@/features/cameras/live/components/camera-live-page';

type CameraLiveDialogProps = {
  camera: AdoptedCamera | null;
  open: boolean;
  onClose: () => void;
  onSwitchCamera: (camera: AdoptedCamera) => void;
};

export const CameraLiveDialog = ({
  camera,
  open,
  onClose,
  onSwitchCamera,
}: CameraLiveDialogProps) => {
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

  if (!open || !camera) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close live view"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${camera.name} live view`}
        className="relative z-10 flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xl"
      >
        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <CameraLivePage
            camera={camera}
            onClose={onClose}
            onSwitchCamera={onSwitchCamera}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
};
