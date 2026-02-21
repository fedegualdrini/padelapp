'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type PlayerOption = { id: string; name: string };

type Props = {
  players: PlayerOption[];
};

function buildQuery(next: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function MatchFiltersButton({ players }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPlayerId = searchParams.get('playerId') ?? '';
  const currentFrom = searchParams.get('from') ?? '';
  const currentTo = searchParams.get('to') ?? '';

  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState(currentPlayerId);
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  const activeCount = useMemo(() => {
    let n = 0;
    if (currentPlayerId) n++;
    if (currentFrom) n++;
    if (currentTo) n++;
    return n;
  }, [currentPlayerId, currentFrom, currentTo]);

  const apply = () => {
    const qs = buildQuery({
      playerId: playerId || null,
      from: from || null,
      to: to || null,
    });
    router.push(`${pathname}${qs}`);
    setOpen(false);
  };

  const clear = () => {
    setPlayerId('');
    setFrom('');
    setTo('');
    router.push(pathname);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--ink)] min-h-[44px] flex items-center"
      >
        Filtrar{activeCount ? ` (${activeCount})` : ''}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Filtros
              </p>
              <h3 className="font-display text-lg sm:text-xl text-[var(--ink)]">
                Buscar partidos
              </h3>
            </div>

            <div className="grid gap-3 sm:gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="text-[var(--muted)]">Jugador</span>
                <select
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  className="rounded-xl border border-[color:var(--card-border)] bg-white/70 px-3 py-2.5 sm:py-3 text-[var(--ink)] min-h-[44px]"
                >
                  <option value="">(Cualquiera)</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-[var(--muted)]">Desde</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="rounded-xl border border-[color:var(--card-border)] bg-white/70 px-3 py-2.5 sm:py-3 text-[var(--ink)] min-h-[44px]"
                  />
                </label>

                <label className="grid gap-1.5 text-sm">
                  <span className="text-[var(--muted)]">Hasta</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="rounded-xl border border-[color:var(--card-border)] bg-white/70 px-3 py-2.5 sm:py-3 text-[var(--ink)] min-h-[44px]"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={clear}
                className="rounded-full border border-[color:var(--card-border)] bg-transparent px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink)] min-h-[44px]"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={apply}
                className="rounded-full bg-[var(--accent)] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white min-h-[44px]"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
