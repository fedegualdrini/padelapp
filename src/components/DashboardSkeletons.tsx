import { Skeleton } from './Skeleton';

export function NextMatchCardSkeleton() {
  return (
    <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[var(--shadow-card)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-36" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Attendance card */}
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
          <Skeleton className="h-4 w-20" />
          
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg p-2">
                <Skeleton className="h-6 w-6 mx-auto" />
                <Skeleton className="h-3 w-8 mx-auto mt-1" />
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-9 w-14 rounded-lg" />
              <Skeleton className="h-9 w-16 rounded-lg" />
              <Skeleton className="h-9 w-14 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Who's there card */}
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
          <Skeleton className="h-4 w-28" />
          
          <div className="mt-3 flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Skeleton className="h-3 w-56 mt-4" />
    </section>
  );
}

export function EloLeaderboardSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 sm:px-4 py-2.5 sm:py-3"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>
            <Skeleton className="h-4 w-8 sm:w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyStateSkeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 sm:p-6 md:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-11 w-44 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <NextMatchCardSkeleton />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
              {/* Simplified match skeleton for recent matches */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`py-3 ${i < 2 ? 'border-b border-[color:var(--card-border)]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <EloLeaderboardSkeleton />

          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </div>
        </div>
      </section>
    </div>
  );
}
