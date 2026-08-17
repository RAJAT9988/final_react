import { Eye, Trash2 } from 'lucide-react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export type CameraStatus = 'Online' | 'Connecting' | 'Error';

export type AdoptedCamera = {
  id: string;
  name: string;
  status: CameraStatus;
  cameraStatus: string;
  companyDeviceId: string;
  cameraType: string;
  manufacturer: string;
  model: string;
  room: string;
  location: string;
  zone: string;
  department: string;
  cameraGroup: string;
  provider: string;
  lastSeen: string;
  rtspUrl?: string | null;
  errorMessage?: string;
};

type AdoptedCamerasProps = {
  cameras: AdoptedCamera[];
  selectedId: string | null;
  canAdd?: boolean;
  emptyMessage?: string;
  onSelect: (id: string) => void;
  onOpenDetails: (camera: AdoptedCamera) => void;
  onOpenCamera: (camera: AdoptedCamera) => void;
  onAdd: () => void;
  onDelete: (camera: AdoptedCamera) => void;
};

const statusClass: Record<CameraStatus, string> = {
  Online: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Connecting: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Error: 'bg-red-50 text-red-700 ring-red-600/20',
};

export const AdoptedCameras = ({
  cameras,
  selectedId,
  canAdd = true,
  emptyMessage = 'No cameras on this device.',
  onSelect,
  onOpenDetails,
  onOpenCamera,
  onAdd,
  onDelete,
}: AdoptedCamerasProps) => {
  const selectedCamera =
    cameras.find((camera) => camera.id === selectedId) ?? null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Adopted Cameras
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            List of added cameras.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (selectedCamera) onOpenCamera(selectedCamera);
            }}
            disabled={!selectedCamera}
          >
            Open Camera
          </Button>
          <Button type="button" onClick={onAdd} disabled={!canAdd}>
            + Add Camera
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!selectedCamera}
            onClick={() => {
              if (selectedCamera) onDelete(selectedCamera);
            }}
          >
            Delete
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Camera Name</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Manufacturer / Model</th>
              <th className="px-5 py-3">Room</th>
              <th className="px-5 py-3">Provider</th>
              <th className="px-5 py-3">Last Seen</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cameras.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              cameras.map((camera) => (
              <Fragment key={camera.id}>
                <tr
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-slate-50',
                    selectedId === camera.id && 'bg-slate-50',
                  )}
                  onClick={() => {
                    onSelect(camera.id);
                    onOpenDetails(camera);
                  }}
                >
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {camera.name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                        statusClass[camera.status],
                      )}
                    >
                      {camera.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    <div className="font-medium">{camera.manufacturer}</div>
                    <div className="text-xs text-slate-500">{camera.model}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{camera.room}</td>
                  <td className="px-5 py-3 text-slate-700">
                    {camera.provider}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {camera.lastSeen}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="View"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCamera(camera);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(camera);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                {camera.status === 'Error' && camera.errorMessage ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="bg-red-50 px-5 py-2 text-sm text-red-700"
                    >
                      Error: {camera.errorMessage}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
        Showing 1 to {cameras.length} of {cameras.length} cameras
      </footer>
    </section>
  );
};
