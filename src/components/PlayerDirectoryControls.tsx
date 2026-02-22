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
    <>
      {/* Status filter buttons row */}
      <div className="flex flex-wrap gap-2">
        {statusButton('all', 'Todos')}
        {statusButton('usual', 'Habituales')}
        {statusButton('invite', 'Invitados')}
      </div>

      {/* Search input - will be used in parent layout */}
      <input
        value={q}
        onChange={(e) => {
          const next = e.target.value;
          setQ(next);
          applyUrl(next, urlStatus);
        }}
        placeholder="Buscar jugador..."
        className="w-full rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm text-[var(--ink)]"
      />
    </>
  );
}

// Export a separate component for just the search input
export function PlayerSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatusRaw = searchParams.get('status') ?? 'all';
  const urlStatus: StatusFilter = (['all', 'usual', 'invite'].includes(urlStatusRaw)
    ? urlStatusRaw
    : 'all') as StatusFilter;

  const [q, setQ] = useState(urlQ);

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  const applyUrl = (nextQ: string, nextStatus: StatusFilter) => {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextStatus !== 'all') params.set('status', nextStatus);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  return (
    <input
      value={q}
      onChange={(e) => {
        const next = e.target.value;
        setQ(next);
        applyUrl(next, urlStatus);
      }}
      placeholder="Buscar jugador..."
      className="w-full rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm text-[var(--ink)]"
    />
  );
}

// Export status buttons separately
export function PlayerStatusButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatusRaw = searchParams.get('status') ?? 'all';
  const urlStatus: StatusFilter = (['all', 'usual', 'invite'].includes(urlStatusRaw)
    ? urlStatusRaw
    : 'all') as StatusFilter;

  const applyUrl = (nextQ: string, nextStatus: StatusFilter) => {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextStatus !== 'all') params.set('status', nextStatus);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  const statusButton = (value: StatusFilter, label: string) => (
    <button
      type="button"
      onClick={() => applyUrl(urlQ, value)}
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
    <div className="flex flex-wrap gap-2">
      {statusButton('all', 'Todos')}
      {statusButton('usual', 'Habituales')}
      {statusButton('invite', 'Invitados')}
    </div>
  );
}
