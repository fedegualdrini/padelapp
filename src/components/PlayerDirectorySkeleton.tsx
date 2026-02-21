import { Skeleton } from './Skeleton';

export function PlayerCardSkeleton() {
  return (
    <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      
      <div className="mt-2 flex gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="mt-2 space-y-1">
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

export function PlayerDirectorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Usual players section */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlayerCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Invited players section */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PlayerCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function MatchesPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur"
          >
            {/* Match card skeleton simplified */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-3">
              {Array.from({ length: 2 }).map((_, team) => (
                <div key={team} className={`flex items-center gap-3 ${team === 0 ? 'pb-3 mb-3 border-b border-[color:var(--card-border)]' : ''}`}>
                  <div className="flex -space-x-1.5">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 mt-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
