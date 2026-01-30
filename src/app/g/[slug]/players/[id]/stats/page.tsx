import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGroupBySlug,
  getPlayerById,
  getPlayerStats,
  getEloTimeline,
  getPlayerPartnerStats,
  getPlayerRecentForm,
  getOpponentRecord,
  getWinRateTrend,
} from "@/lib/data";
import { getPlayerStreaks } from "@/lib/streaks";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PlayerStatsDashboard from "@/components/PlayerStatsDashboard";

type PlayerStatsPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function PlayerStatsPage({ params }: PlayerStatsPageProps) {
  const { slug, id } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const player = await getPlayerById(group.id, id);

  if (!player) {
    notFound();
  }

  // Fetch all stats data in parallel
  const supabase = await createSupabaseServerClient();

  const [
    stats,
    eloTimeline,
    partnerStats,
    recentForm,
    streaks,
    opponentRecords,
    winRateTrend,
    achievements,
  ] = await Promise.all([
    getPlayerStats(group.id),
    getEloTimeline(group.id),
    getPlayerPartnerStats(group.id, id),
    getPlayerRecentForm(group.id, id, 10),
    getPlayerStreaks(group.id, id),
    getOpponentRecord(group.id, id),
    getWinRateTrend(group.id, id, "month"),
    supabase.rpc('get_player_achievements', { p_group_id: group.id, p_player_id: id }),
  ]);

  const achievementsData = achievements.data || { unlocked: [], locked: [] };

  const playerStats = stats.find((s) => s.player_id === id) || null;
  const playerEloData = eloTimeline.find((e) => e.playerId === id);
  const currentElo = playerEloData?.points.length
    ? playerEloData.points[playerEloData.points.length - 1].rating
    : 1000;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl text-[var(--ink)]">{player.name}</h2>
            <span className="rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-xs font-medium text-white">
              Estadísticas
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            ELO actual: <span className="font-semibold text-[var(--ink)]">{currentElo}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/g/${slug}/players/${id}`}
            className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            Resumen
          </Link>
          <Link
            href={`/g/${slug}/players`}
            className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            ← Volver
          </Link>
        </div>
      </div>

      {/* Main Dashboard */}
      <PlayerStatsDashboard
        playerId={id}
        playerName={player.name}
        groupSlug={slug}
        playerStats={playerStats}
        currentElo={currentElo}
        recentForm={recentForm}
        streaks={streaks}
        partnerStats={partnerStats}
        opponentRecords={opponentRecords}
        winRateTrend={winRateTrend}
        eloTimeline={playerEloData?.points || []}
        achievements={achievementsData}
      />
    </div>
  );
}
