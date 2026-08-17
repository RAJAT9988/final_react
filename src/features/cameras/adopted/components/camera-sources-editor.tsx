import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';

export type SourceRole = 'high' | 'mid' | 'low' | 'snapshot';

export type CameraSourceDraft = {
  id: string;
  name: string;
  role: SourceRole;
  url: string;
};

type CameraSourcesEditorProps = {
  sources: CameraSourceDraft[];
  onChange: (sources: CameraSourceDraft[]) => void;
};

export const createCameraSource = (
  overrides?: Partial<CameraSourceDraft>,
): CameraSourceDraft => ({
  id: crypto.randomUUID(),
  name: 'Main stream',
  role: 'high',
  url: '',
  ...overrides,
});

export const CameraSourcesEditor = ({
  sources,
  onChange,
}: CameraSourcesEditorProps) => {
  const { addNotification } = useNotifications();

  const updateSource = (
    id: string,
    patch: Partial<Pick<CameraSourceDraft, 'name' | 'role' | 'url'>>,
  ) => {
    onChange(
      sources.map((source) =>
        source.id === id ? { ...source, ...patch } : source,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sources
        </p>
        <p className="mt-1 text-sm text-slate-600">
          At least one live stream is required.
        </p>
      </div>

      {sources.map((source, index) => (
        <div
          key={source.id}
          className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">
              Source {index + 1}
            </p>
            {sources.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange(sources.filter((item) => item.id !== source.id))
                }
              >
                Remove
              </Button>
            ) : null}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Name</span>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              value={source.name}
              onChange={(e) =>
                updateSource(source.id, { name: e.target.value })
              }
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Role</span>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              value={source.role}
              onChange={(e) =>
                updateSource(source.id, {
                  role: e.target.value as SourceRole,
                })
              }
            >
              <option value="high">high</option>
              <option value="mid">mid</option>
              <option value="low">low</option>
              <option value="snapshot">snapshot</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">URL</span>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
              placeholder="rtsp://..."
              value={source.url}
              onChange={(e) => updateSource(source.id, { url: e.target.value })}
            />
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              addNotification({
                type: 'info',
                title: 'Test source',
                message: source.url
                  ? `Would test ${source.url}`
                  : 'Enter a URL first.',
              })
            }
          >
            Test source
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...sources, createCameraSource()])}
      >
        + Add source
      </Button>
    </div>
  );
};
