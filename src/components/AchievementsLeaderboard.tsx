"use client";

import Link from "next/link";
import AchievementBadge from './AchievementBadge';

type PlayerAchievementSummary = {
  player_id: string;
  player_name: string;
  achievements_count: number;
  rarest_badge: {
    name: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
};

type AchievementsLeaderboardProps = {
  players: PlayerAchievementSummary[];
  groupSlug?: string;
};

const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };

export default function AchievementsLeaderboard({
  players,
  groupSlug,
}: AchievementsLeaderboardProps) {
  // Sort by achievements count, then by rarest badge rarity
  const sorted = [...players].sort((a, b) => {
    if (b.achievements_count !== a.achievements_count) {
      return b.achievements_count - a.achievements_count;
    }
    return rarityOrder[a.rarest_badge.rarity] - rarityOrder[b.rarest_badge.rarity];
  });

  const maxCount = sorted.length > 0 ? sorted[0].achievements_count : 1;

  return (
    <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-[var(--ink)]">
          🏆 Ranking de Logros
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Jugadores ordenados por cantidad de logros desbloqueados
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-[var(--ink)] font-medium">¡Sé el primero en desbloquear logros!</p>
          <p className="text-sm text-[var(--muted)] mt-2">
            Juega partidos y acumula victorias para desbloquear logros.
          </p>
          {groupSlug && (
            <Link
              href={`/g/${groupSlug}/matches/new`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Registrar partido
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((player, index) => (
            <Link
              key={player.player_id}
              href={groupSlug ? `/g/${groupSlug}/players/${player.player_id}` : '#'}
              className="flex items-center gap-4 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 transition-all hover:scale-[1.01] hover:shadow-md hover:border-[color:var(--accent)]"
            >
              {/* Rank */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--card-glass)] font-display text-lg font-bold text-[var(--ink)]">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
              </div>

              {/* Player name */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--ink)] truncate">{player.player_name}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {player.achievements_count} {player.achievements_count === 1 ? 'logro' : 'logros'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="hidden sm:block w-32 md:w-48">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--card-border)]">
                  <div
                    className="h-full bg-gradient-to-r from-[color:var(--accent)] to-emerald-500 transition-all duration-500"
                    style={{ width: `${(player.achievements_count / maxCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Rarest badge */}
              <AchievementBadge
                name={player.rarest_badge.name}
                icon={player.rarest_badge.icon}
                rarity={player.rarest_badge.rarity}
                size="md"
                showTooltip={true}
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
