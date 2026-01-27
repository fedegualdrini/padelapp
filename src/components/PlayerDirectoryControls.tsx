'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type StatusFilter = 'all' | 'usual' | 'invite';

function buildQuery(next: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function PlayerDirectoryControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatusRaw = searchParams.get('status') ?? 'all';
  const urlStatus: StatusFilter = (['all', 'usual', 'invite'].includes(urlStatusRaw)
    ? urlStatusRaw
    : 'all') as StatusFilter;

  const [q, setQ] = useState(urlQ);

  // Keep input in sync when navigating back/forward.
  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  const applyUrl = (nextQ: string, nextStatus: StatusFilter) => {
    const qs = buildQuery({
      q: nextQ.trim() ? nextQ.trim() : null,
      status: nextStatus !== 'all' ? nextStatus : null,
    });
    router.push(`${pathname}${qs}`);
  };

  const statusButton = (value: StatusFilter, label: string) => (
    <button
      type="button"
      onClick={() => applyUrl(q, value)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        urlStatus === value
          ? 'bg-[var(--accent)] text-white'
          : 'border border-[color:var(--card-border)] bg-[color:var(--card-glass)] text-[var(--ink)] hover:bg-white/40'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {statusButton('all', 'Todos')}
        {statusButton('usual', 'Habituales')}
        {statusButton('invite', 'Invitados')}
      </div>

      <input
        value={q}
        onChange={(e) => {
          const next = e.target.value;
          setQ(next);
          applyUrl(next, urlStatus);
        }}
        placeholder="Buscar jugador..."
        className="w-full rounded-full border border-[color:var(--card-border)] bg-white/70 px-4 py-2 text-sm text-[var(--ink)] sm:w-72"
      />
    </div>
  );
}
