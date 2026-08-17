import type { HomeEvent } from '@/features/home/api/get-recent-events';

type RecentEventsProps = {
  events: HomeEvent[];
  isLoading?: boolean;
};

export const RecentEvents = ({ events, isLoading }: RecentEventsProps) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          Recent Events
        </h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Latest activity across your cameras.
        </p>
      </header>

      {isLoading ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          Loading events…
        </p>
      ) : events.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          No recent events
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[10px] font-semibold uppercase text-white">
                {event.kind.slice(0, 3)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {event.label}
                </p>
                <p className="text-xs text-slate-500">
                  {event.cameraName} · {event.time}
                </p>
              </div>
              <span className="shrink-0 text-xs uppercase text-slate-400">
                {event.kind}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
