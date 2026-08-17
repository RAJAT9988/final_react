import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { useHomeCameras } from '@/features/home/api/get-home-cameras';
import { useRecentEvents } from '@/features/home/api/get-recent-events';
import { CameraFeedGrid } from '@/features/home/components/camera-feed-grid';
import { RecentEvents } from '@/features/home/components/recent-events';

export const HomePage = () => {
  const { addNotification } = useNotifications();
  const camerasQuery = useHomeCameras();
  const eventsQuery = useRecentEvents();

  const refresh = () => {
    void camerasQuery.refetch();
    void eventsQuery.refetch();
  };

  return (
    <div className="space-y-6 p-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Home
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Recent events and camera snapshots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              addNotification({
                type: 'info',
                title: 'Change layout',
                message: 'Stub action for now.',
              })
            }
          >
            Change layout
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              addNotification({
                type: 'info',
                title: 'Lock order',
                message: 'Stub action for now.',
              })
            }
          >
            Lock order
          </Button>
        </div>
      </div>

      <RecentEvents
        events={eventsQuery.data ?? []}
        isLoading={eventsQuery.isLoading}
      />
      <CameraFeedGrid
        cameras={camerasQuery.data ?? []}
        isLoading={camerasQuery.isLoading}
        onRefresh={refresh}
      />
    </div>
  );
};
