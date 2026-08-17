import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import type { HomeCamera } from '@/features/home/api/get-home-cameras';
import { cn } from '@/utils/cn';

type CameraFeedGridProps = {
  cameras: HomeCamera[];
  isLoading?: boolean;
  onRefresh: () => void;
};

export const CameraFeedGrid = ({
  cameras,
  isLoading,
  onRefresh,
}: CameraFeedGridProps) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Cameras</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Snapshot cards from your adopted cameras.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate(paths.app.cameras.getHref())}
          >
            More
          </Button>
        </div>
      </header>

      {isLoading ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          Loading cameras…
        </p>
      ) : cameras.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          No cameras yet. Add one from Cameras.
        </p>
      ) : (
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {cameras.map((camera) => (
            <article
              key={camera.id}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              <div className="relative aspect-video bg-slate-900 p-3 text-white">
                <span
                  className={cn(
                    'absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-medium',
                    camera.status === 'Online' &&
                      'bg-emerald-500/20 text-emerald-200',
                    camera.status === 'Connecting' &&
                      'bg-amber-500/20 text-amber-200',
                    camera.status === 'Error' && 'bg-red-500/20 text-red-200',
                  )}
                >
                  {camera.status}
                </span>
                <div className="absolute bottom-3 left-3">
                  <p className="text-sm font-semibold">{camera.name}</p>
                  <p className="text-xs text-white/70">
                    {camera.snapshotLabel}
                  </p>
                </div>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{camera.lastSeen}</span>
                  <span>{camera.latencyMs} ms</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onRefresh}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      navigate(paths.app.cameraLive.getHref(camera.id))
                    }
                  >
                    Open
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      addNotification({
                        type: 'info',
                        title: 'Options',
                        message: 'Stub action for now.',
                      })
                    }
                  >
                    Options
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
