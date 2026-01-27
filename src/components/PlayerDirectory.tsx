'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AddPlayerForm from '@/app/g/[slug]/players/AddPlayerForm';
import EditPlayerForm from '@/app/g/[slug]/players/EditPlayerForm';
import FormIndicator from '@/components/FormIndicator';

type Player = { id: string; name: string; status: string };

type PlayerStat = {
  player_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  undecided: number;
  win_rate: number | null;
};

type StatusFilter = 'all' | 'usual' | 'invite';

function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function buildQuery(next: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function PlayerDirectory({
  groupId,
  groupSlug,
  players,
  stats,
}: {
  groupId: string;
  groupSlug: string;
  players: Player[];
  stats: PlayerStat[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlStatus = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [q, setQ] = useState(urlQ);

  const statsByPlayer = useMemo(() => {
    return new Map(stats.map((row) => [row.player_id, row] as const));
  }, [stats]);

  const effectiveStatus: StatusFilter = ['all', 'usual', 'invite'].includes(urlStatus)
    ? urlStatus
    : 'all';

  const applyUrl = (nextQ: string, nextStatus: StatusFilter) => {
    const qs = buildQuery({
      q: nextQ.trim() ? nextQ.trim() : null,
      status: nextStatus !== 'all' ? nextStatus : null,
    });
    router.push(`${pathname}${qs}`);
  };

  const filteredPlayers = useMemo(() => {
    const nq = normalize(q);

    return players.filter((p) => {
      const statusOk =
        effectiveStatus === 'all'
          ? true
          : effectiveStatus === 'usual'
            ? p.status === 'usual'
            : p.status !== 'usual';

      if (!statusOk) return false;

      if (!nq) return true;
      return normalize(p.name).includes(nq);
    });
  }, [players, q, effectiveStatus]);

  const usuals = filteredPlayers.filter((p) => p.status === 'usual');
  const invites = filteredPlayers.filter((p) => p.status !== 'usual');

  const statusButton = (value: StatusFilter, label: string) => (
    <button
      type="button"
      onClick={() => applyUrl(q, value)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        effectiveStatus === value
          ? 'bg-[var(--accent)] text-white'
          : 'border border-[color:var(--card-border)] bg-[color:var(--card-glass)] text-[var(--ink)] hover:bg-white/40'
      }`}
    >
      {label}
    </button>
  );

  const renderCard = (player: Player) => {
    const stat = statsByPlayer.get(player.id);

    return (
      <div
        key={player.id}
        className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
      >
        <div className="flex items-center gap-2">
          <EditPlayerForm
            playerId={player.id}
            initialName={player.name}
            groupId={groupId}
            groupSlug={groupSlug}
          />
          <FormIndicator groupId={groupId} playerId={player.id} />
        </div>

        {stat ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {stat.matches_played} partidos · {stat.wins}G - {stat.losses}P
            {stat.undecided ? ` · ${stat.undecided} sin resultado` : ''} ·{' '}
            {Math.round((stat.win_rate ?? 0) * 100)}% de victorias
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {player.status === 'usual' ? 'Sin partidos' : 'Disponible como suplente'}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h2 className="font-display text-2xl text-[var(--ink)]">Jugadores</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sumá jugadores habituales e invitados.
        </p>

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
              // update URL immediately (simple + deterministic; repo is small)
              applyUrl(next, effectiveStatus);
            }}
            placeholder="Buscar jugador..."
            className="w-full sm:w-72 rounded-full border border-[color:var(--card-border)] bg-white/70 px-4 py-2 text-sm text-[var(--ink)]"
          />
        </div>

        <div className="mt-4">
          <AddPlayerForm groupId={groupId} groupSlug={groupSlug} />
        </div>
      </section>

      {effectiveStatus === 'invite' ? null : (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Habituales</h3>
          {usuals.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Sin resultados.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {usuals.map(renderCard)}
            </div>
          )}
        </section>
      )}

      {effectiveStatus === 'usual' ? null : (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Invitados</h3>
          {invites.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">Sin resultados.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {invites.map(renderCard)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
