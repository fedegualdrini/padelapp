import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGroupBySlug,
  getPlayerById,
  getPlayerStats,
  getEloTimeline,
  getPlayerPartnerStats,
  getPlayerRecentMatches,
  getPlayerRecentForm,
} from "@/lib/data";
import { getPlayerStreaks } from "@/lib/streaks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MiniEloChart from "./MiniEloChart";
import StreakHistoryChart from "./StreakHistoryChart";
import AchievementsSection from "@/components/AchievementsSection";
import PlayerPartnerships from "@/components/PlayerPartnerships";

type PlayerProfilePageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { slug, id } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const player = await getPlayerById(group.id, id);

  if (!player) {
    notFound();
  }

  // Fetch all profile data in parallel
  const supabase = await createSupabaseServerClient();

  const [stats, eloTimeline, partnerStats, recentMatches, recentForm, streaks, achievements] = await Promise.all([
    getPlayerStats(group.id),
    getEloTimeline(group.id),
    getPlayerPartnerStats(group.id, id),
    getPlayerRecentMatches(group.id, id, 15),
    getPlayerRecentForm(group.id, id, 10),
    getPlayerStreaks(group.id, id),
    supabase.rpc('get_player_achievements', { p_group_id: group.id, p_player_id: id }),
  ]);

  const achievementsData = achievements.data || { unlocked: [], locked: [] };

  const playerStats = stats.find((s) => s.player_id === id);
  const playerEloData = eloTimeline.find((e) => e.playerId === id);
  const currentElo = playerEloData?.points.length
    ? playerEloData.points[playerEloData.points.length - 1].rating
    : 1000;

  const isUsual = player.status === "usual";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl text-[var(--ink)]">{player.name}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isUsual
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {isUsual ? "Habitual" : "Invitado"}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            ELO actual: <span className="font-semibold text-[var(--ink)]">{currentElo}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/g/${slug}/players/${id}/rackets`}
            className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[color:var(--card-solid)]"
          >
            🏓 Mis Rackets
          </Link>
          <Link
            href={`/g/${slug}/players`}
            className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            ← Volver a jugadores
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">Estadísticas</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Partidos</p>
            <p className="mt-1 font-display text-2xl text-[var(--ink)]">
              {playerStats?.matches_played ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Victorias</p>
            <p className="mt-1 font-display text-2xl text-emerald-600">
              {playerStats?.wins ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Derrotas</p>
            <p className="mt-1 font-display text-2xl text-rose-500">
              {playerStats?.losses ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">% Victoria</p>
            <p className="mt-1 font-display text-2xl text-[var(--accent)]">
              {playerStats?.win_rate ? `${Math.round(playerStats.win_rate * 100)}%` : "-"}
            </p>
          </div>
        </div>

        {/* Streak Overview */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {/* Current Streak */}
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Racha actual</p>
            {streaks.currentStreak !== 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl">{streaks.currentStreak > 0 ? "🔥" : "❄️"}</span>
                <span
                  className={`font-display text-2xl ${
                    streaks.currentStreak > 0 ? "text-orange-600" : "text-blue-600"
                  }`}
                >
                  {Math.abs(streaks.currentStreak)}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {streaks.currentStreak > 0 ? "victorias" : "derrotas"}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-[var(--muted)]">Sin racha activa</p>
            )}
          </div>

          {/* Longest Win Streak */}
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Mejor racha ganadora</p>
            {streaks.longestWinStreak > 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="font-display text-2xl text-emerald-600">
                  {streaks.longestWinStreak}
                </span>
                <span className="text-sm text-[var(--muted)]">victorias</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-[var(--muted)]">Sin victorias</p>
            )}
          </div>

          {/* Longest Loss Streak */}
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Peor racha perdedora</p>
            {streaks.longestLossStreak > 0 ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl">📉</span>
                <span className="font-display text-2xl text-rose-600">
                  {streaks.longestLossStreak}
                </span>
                <span className="text-sm text-[var(--muted)]">derrotas</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-[var(--muted)]">Sin derrotas</p>
            )}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <AchievementsSection
        unlocked={achievementsData.unlocked}
        locked={achievementsData.locked}
      />

      {/* Partnerships Section */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">Partnerships</h3>
        <div className="mt-4">
          <PlayerPartnerships
            playerId={id}
            groupSlug={slug}
            playerName={player.name}
          />
        </div>
      </section>

      {/* ELO Chart */}
      {playerEloData && playerEloData.points.length > 0 && (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Evolución ELO</h3>
          <div className="mt-4">
            <MiniEloChart data={playerEloData.points} />
          </div>
        </section>
      )}

      {/* Recent Matches */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--ink)]">Partidos recientes</h3>
          <Link
            href={`/g/${slug}/matches?playerId=${id}`}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Ver todos los partidos →
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Sin partidos registrados.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        match.result === "win"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}
                    >
                      {match.result === "win" ? "G" : "P"}
                    </span>
                    <span className="text-sm text-[var(--muted)]">{match.playedAt}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                    vs {match.opponentTeam}
                  </p>
                  {match.partnerName && (
                    <p className="text-xs text-[var(--muted)]">con {match.partnerName}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--ink)]">{match.score}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Streak History */}
      {streaks.streakHistory.length > 0 && (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Historial de rachas</h3>
          <div className="mt-4">
            <StreakHistoryChart streakHistory={streaks.streakHistory} />
          </div>
        </section>
      )}

      {/* Partner Stats */}
      {partnerStats.length > 0 && (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Mejores compañeros</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {partnerStats.map((partner) => (
              <div
                key={partner.partnerId}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--ink)]">{partner.partnerName}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      partner.partnerStatus === "usual"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {partner.partnerStatus === "usual" ? "H" : "I"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {partner.matchesPlayed} partidos · {partner.wins}G - {partner.losses}P
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--accent)]">
                  {Math.round(partner.winRate * 100)}% victorias
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
