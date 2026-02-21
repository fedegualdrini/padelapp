import { Skeleton } from './Skeleton';

export function MatchCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      {/* Header: Date and match info */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-14 rounded" />
      </div>

      {/* Score table skeleton */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)]">
        {/* Header row */}
        <div className="grid border-b border-[color:var(--card-border)] bg-[var(--bg-base)] grid-cols-[1fr_repeat(3,2.5rem)_2.5rem]">
          <div className="px-2 sm:px-3 py-2">
            <Skeleton className="h-4 w-12" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-center py-2">
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
          <div className="flex items-center justify-center py-2">
            <Skeleton className="h-4 w-8" />
          </div>
        </div>

        {/* Team rows */}
        {[1, 2].map((team) => (
          <div
            key={team}
            className={`grid border-[color:var(--card-border)] grid-cols-[1fr_repeat(3,2.5rem)_2.5rem] ${team === 1 ? 'border-b' : ''}`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5">
              {/* Player avatars */}
              <div className="flex -space-x-1.5 shrink-0">
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
              </div>
              {/* Player names */}
              <Skeleton className="h-4 w-32" />
            </div>
            {/* Set scores */}
            {[1, 2, 3].map((set) => (
              <div key={set} className="flex items-center justify-center py-2.5">
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
            {/* Sets won */}
            <div className="flex items-center justify-center py-2.5">
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Result indicator */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function MatchListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}
