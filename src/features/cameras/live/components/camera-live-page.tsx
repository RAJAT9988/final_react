import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useAdoptedCameras } from '@/features/cameras/adopted/api/get-adopted-cameras';
import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import { useCameraEvents } from '@/features/cameras/live/api/get-camera-events';
import { cn } from '@/utils/cn';

type CameraLivePageProps = {
  camera: AdoptedCamera;
  onClose?: () => void;
  onSwitchCamera?: (camera: AdoptedCamera) => void;
};

type StreamMode = 'WebRTC' | 'MSE';
type Quality = 'High' | 'Mid' | 'Low';
type EventFilter = 'All' | 'Motion' | 'Person' | 'Doorbell';

const toggleControls = ['Mute', 'Talk', 'PTZ', 'PiP', 'Zones'] as const;
const actionControls = ['Snapshot', 'Share', 'Cast', 'Log'] as const;

export const CameraLivePage = ({
  camera,
  onClose,
  onSwitchCamera,
}: CameraLivePageProps) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const camerasQuery = useAdoptedCameras();
  const eventsQuery = useCameraEvents({ cameraId: camera.id });
  const [mode, setMode] = useState<StreamMode>('WebRTC');
  const [quality, setQuality] = useState<Quality>('High');
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<EventFilter>('All');

  const cameras = camerasQuery.data ?? [];
  const cameraOptions = cameras.some((item) => item.id === camera.id)
    ? cameras
    : [camera, ...cameras];

  const events =
    filter === 'All'
      ? (eventsQuery.data ?? [])
      : (eventsQuery.data ?? []).filter((event) => event.kind === filter);

  const toast = (title: string) => {
    addNotification({ type: 'info', title, message: 'Stub action for now.' });
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(paths.app.cameras.getHref());
  };

  const switchCamera = (nextId: string) => {
    if (nextId === camera.id) return;
    const next = cameraOptions.find((item) => item.id === nextId);
    if (!next) return;
    if (onSwitchCamera) {
      onSwitchCamera(next);
      return;
    }
    navigate(paths.app.cameraLive.getHref(next.id), {
      replace: true,
      state: { camera: next },
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col p-6 sm:px-8">
      <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3 pr-10">
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="Back to cameras"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
          Live view &amp; settings
        </p>
        <div className="relative min-w-0 max-w-full flex-1 sm:max-w-xs">
          <label htmlFor="live-camera-select" className="sr-only">
            Select camera
          </label>
          <select
            id="live-camera-select"
            value={camera.id}
            onChange={(e) => switchCamera(e.target.value)}
            className="w-full appearance-none truncate rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-9 text-base font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
          >
            {cameraOptions.map((item) => (
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

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-xl bg-slate-900">
            <span className="absolute left-3 top-3 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Live
            </span>
            <span className="absolute bottom-3 left-3 text-sm font-semibold text-white">
              {camera.name}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['WebRTC', 'MSE'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    mode === value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  )}
                >
                  {value}
                </button>
              ))}
              {(['High', 'Mid', 'Low'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuality(value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    quality === value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {toggleControls.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setToggles((prev) => ({ ...prev, [label]: !prev[label] }))
                  }
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium',
                    toggles[label]
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  )}
                >
                  {label}
                </button>
              ))}
              {actionControls.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toast(label)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="text-sm text-slate-500">
              Streaming: {mode} · Quality: {quality}
            </p>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-4">
          <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Events</h2>
                <p className="text-xs text-slate-500">Only this camera</p>
              </div>
              <Button type="button" size="sm" variant="outline">
                Live
              </Button>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {(['All', 'Motion', 'Person', 'Doorbell'] as const).map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      filter === value
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    )}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>

            {eventsQuery.isLoading ? (
              <div className="flex flex-1 items-center justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[10px] font-semibold uppercase text-white">
                      {event.kind.slice(0, 3)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        {event.time}
                      </p>
                      <p className="truncate text-sm text-slate-900">
                        {event.label}{' '}
                        <span className="text-xs uppercase text-slate-400">
                          {event.kind}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
                {events.length === 0 ? (
                  <li className="py-6 text-center text-sm text-slate-500">
                    No events for this filter
                  </li>
                ) : null}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Status
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-slate-500">Camera</span>
                <strong className="text-right text-slate-900">
                  {camera.name}
                </strong>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-slate-500">State</span>
                <strong
                  className={cn(
                    camera.status === 'Online' && 'text-emerald-700',
                    camera.status === 'Connecting' && 'text-amber-700',
                    camera.status === 'Error' && 'text-red-700',
                  )}
                >
                  {camera.status}
                </strong>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-slate-500">Last motion</span>
                <strong className="text-slate-900">
                  {eventsQuery.data?.[0]?.time ?? '—'}
                </strong>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-slate-500">Codec</span>
                <strong className="text-slate-900">H.264</strong>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};
