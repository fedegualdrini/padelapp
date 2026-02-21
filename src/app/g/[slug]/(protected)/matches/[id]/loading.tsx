import { Skeleton } from '@/components/Skeleton';

export default function MatchDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
            >
              <Skeleton className="h-5 w-32" />
              <div className="mt-2 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20 mt-2" />
              <Skeleton className="h-6 w-16 mt-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
