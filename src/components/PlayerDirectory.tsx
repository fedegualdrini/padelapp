"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddPlayerForm from "@/app/g/[slug]/(protected)/players/AddPlayerForm";
import EditPlayerForm from "@/app/g/[slug]/(protected)/players/EditPlayerForm";
import FormIndicator from '@/components/FormIndicator';
import { fetchGroupStreaksAction } from '@/lib/streaks-actions';
import PlayerDirectoryControls from '@/components/PlayerDirectoryControls';
import PeriodSelector, { type PeriodRange } from '@/components/PeriodSelector';
import ComparePlayersDialog from '@/components/ComparePlayersDialog';
import PlayerAchievementsRow from '@/components/PlayerAchievementsRow';
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, UserPlus } from "lucide-react";

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
    .replace(/[\u0300-\u036f]/g, '');
}

export default function PlayerDirectory({
  groupId,
  groupSlug,
  players,
  stats,
  q,
  status,
  period,
}: {
  groupId: string;
  groupSlug: string;
  players: Player[];
  stats: PlayerStat[];
  q?: string;
  status?: StatusFilter;
  period?: PeriodRange;
}) {
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [groupStreaks, setGroupStreaks] = useState<Record<string, { currentStreak: number }> | null>(null);

  useEffect(() => {
    let alive = true;
    fetchGroupStreaksAction(groupId)
      .then((data) => {
        if (!alive) return;
        // Keep only what we need for the badge.
        const minimal: Record<string, { currentStreak: number }> = {};
        Object.entries(data ?? {}).forEach(([playerId, s]) => {
          minimal[playerId] = { currentStreak: s.currentStreak };
        });
        setGroupStreaks(minimal);
      })
      .catch(() => {
        if (!alive) return;
        setGroupStreaks({});
      });
    return () => {
      alive = false;
    };
  }, [groupId]);

  const effectiveStatus: StatusFilter = ['all', 'usual', 'invite'].includes(status ?? 'all')
    ? (status ?? 'all')
    : 'all';

  const statsByPlayer = useMemo(() => new Map(stats.map((row) => [row.player_id, row] as const)), [stats]);

  const nq = normalize(q ?? '');

  const filteredPlayers = players.filter((p) => {
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

  const usuals = filteredPlayers.filter((p) => p.status === 'usual');
  const invites = filteredPlayers.filter((p) => p.status !== 'usual');

  const renderCard = (player: Player) => {
    const stat = statsByPlayer.get(player.id);

    return (
      <div
        key={player.id}
        className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/g/${groupSlug}/players/${player.id}`}
            className="font-display text-lg text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
          >
            {player.name}
          </Link>
          <EditPlayerForm
            playerId={player.id}
            initialName={player.name}
            groupId={groupId}
            groupSlug={groupSlug}
          />
          <FormIndicator groupId={groupId} playerId={player.id} />
          {(() => {
            const currentStreak = groupStreaks?.[player.id]?.currentStreak ?? 0;
            const minStreak = 2;
            if (Math.abs(currentStreak) < minStreak) return null;
            const isWinStreak = currentStreak > 0;
            const streakCount = Math.abs(currentStreak);
            return (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isWinStreak
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
                title={
                  isWinStreak
                    ? `${streakCount} victorias consecutivas`
                    : `${streakCount} derrotas consecutivas`
                }
              >
                <span>{isWinStreak ? "🔥" : "❄️"}</span>
                <span>
                  {streakCount}
                  {isWinStreak ? "W" : "L"}
                </span>
              </span>
            );
          })()}
        </div>

        <div className="mt-1">
          <PlayerAchievementsRow groupId={groupId} playerId={player.id} />
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
    <>
      <div className="space-y-6">
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-[var(--ink)]">Jugadores</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Sumá jugadores habituales e invitados.
              </p>
            </div>
            <button
              onClick={() => setIsCompareDialogOpen(true)}
              className="w-full sm:w-auto rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90"
            >
              Comparar jugadores
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <PlayerDirectoryControls />
            <PeriodSelector />
          </div>

          <div className="mt-4">
            <AddPlayerForm groupId={groupId} groupSlug={groupSlug} />
          </div>
        </section>

        {effectiveStatus === 'invite' ? null : (
          <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <h3 className="font-display text-lg text-[var(--ink)]">Habituales</h3>
            {usuals.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Users}
                  title="No hay jugadores habituales"
                  description="Agregá jugadores habituales al grupo para empezar a llevar el registro de partidos."
                />
              </div>
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
              <div className="mt-4">
                <EmptyState
                  icon={UserPlus}
                  title="No hay invitados"
                  description="Los invitados son jugadores ocasionales que participan de algunos partidos."
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {invites.map(renderCard)}
              </div>
            )}
          </section>
        )}
      </div>

      <ComparePlayersDialog
        players={filteredPlayers}
        groupSlug={groupSlug}
        isOpen={isCompareDialogOpen}
        onClose={() => setIsCompareDialogOpen(false)}
      />
    </>
  );
}
