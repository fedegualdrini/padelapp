"use client";

import Link from "next/link";
import { TradingViewChart } from "./TradingViewChart";
import AchievementsSection, { Achievement } from "./AchievementsSection";
import type { EloTimelinePoint } from "@/lib/data";
import type {
  PlayerStreaks,
} from "@/lib/streaks";
import type { PartnerStat } from "@/lib/data";
import type { OpponentRecord } from "@/lib/data";
import type { PlayerForm } from "@/lib/data";
import type { WinRateTrend } from "@/lib/data";

type PlayerStats = {
  player_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  undecided: number;
  win_rate: number;
} | null;

type PlayerStatsDashboardProps = {
  playerId: string;
  playerName: string;
  groupSlug: string;
  playerStats: PlayerStats;
  currentElo: number;
  recentForm: PlayerForm | null;
  streaks: PlayerStreaks;
  partnerStats: PartnerStat[];
  opponentRecords: OpponentRecord[];
  winRateTrend: WinRateTrend | null;
  eloTimeline: EloTimelinePoint[];
  achievements: { unlocked: Achievement[]; locked: Achievement[] };
};

// Helper function to format date in Spanish
function formatDate(dateStr: string, format: "short" | "long" = "short"): string {
  const date = new Date(dateStr);
  if (format === "short") {
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  }
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PlayerStatsDashboard({
  playerId,
  playerName,
  groupSlug,
  playerStats,
  currentElo,
  recentForm,
  streaks,
  partnerStats,
  opponentRecords,
  winRateTrend,
  eloTimeline,
  achievements,
}: PlayerStatsDashboardProps) {
  // Calculate rank position (placeholder - would need to get all players)
  const rankPosition = null;

  // Filter partner stats for top 3 pairs with at least 3 matches
  const topPairs = partnerStats
    .filter((p) => p.matchesPlayed >= 3)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  // Sort opponent records by most frequent
  const topOpponents = [...opponentRecords]
    .sort((a, b) => b.totalMatches - a.totalMatches)
    .slice(0, 5);

  // Prepare ELO chart data - convert to TradingViewChart format
  const eloChartData = eloTimeline.length > 0 ? [
    {
      playerId: playerId,
      name: playerName,
      status: "usual",
      points: eloTimeline,
    }
  ] : [];

  // Prepare win rate trend chart data
  const winRateChartData = winRateTrend ? {
    labels: winRateTrend.trend.map((t) => {
      return formatDate(t.period, "short");
    }),
    datasets: [
      {
        label: "Win Rate",
        data: winRateTrend.trend.map((t) => (t.winRate * 100).toFixed(1)),
        borderColor: "hsl(var(--accent))",
        backgroundColor: "hsla(var(--accent), 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: winRateTrend.trend.length > 20 ? 0 : 4,
        pointHoverRadius: 6,
      },
    ],
  } : null;

  const hasMatches = playerStats && playerStats.matches_played > 0;

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Core Stats Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Win Rate */}
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6 text-center">
          <div className="mb-3 inline-flex h-24 w-24 items-center justify-center rounded-full border-4">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: hasMatches && playerStats?.win_rate && playerStats?.win_rate >= 0.5
                  ? "hsla(var(--success), 0.2)"
                  : hasMatches && playerStats?.win_rate && playerStats?.win_rate > 0
                  ? "hsla(var(--warning), 0.2)"
                  : "hsla(var(--error), 0.2)",
                color: hasMatches && playerStats?.win_rate && playerStats?.win_rate >= 0.5
                  ? "var(--success)"
                  : hasMatches && playerStats?.win_rate && playerStats?.win_rate > 0
                  ? "var(--warning)"
                  : "var(--error)",
              }}
            >
              <span className="text-2xl font-bold">
                {hasMatches && playerStats?.win_rate ? `${(playerStats.win_rate * 100).toFixed(0)}%` : "--"}
              </span>
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--muted)]">Win Rate</p>
        </div>

        {/* Matches Played */}
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6 text-center">
          <div className="mb-3">
            <span className="text-4xl font-bold text-[var(--ink)]">
              {hasMatches ? playerStats?.matches_played : "--"}
            </span>
          </div>
          <p className="text-sm font-medium text-[var(--muted)]">Partidos Jugados</p>
          {hasMatches && playerStats && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {playerStats.wins}W - {playerStats.losses}L
            </p>
          )}
        </div>

        {/* Current ELO */}
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6 text-center">
          <div className="mb-3">
            <span className="text-4xl font-bold text-[var(--accent)]">
              {currentElo}
            </span>
          </div>
          <p className="text-sm font-medium text-[var(--muted)]">ELO Actual</p>
          {rankPosition !== null && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              #{rankPosition} en el grupo
            </p>
          )}
        </div>

        {/* Current Streak */}
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            {streaks.currentStreak > 0 && (
              <>
                <span className="text-2xl">🔥</span>
                <span className="text-4xl font-bold text-[var(--success)]">
                  {streaks.currentStreak}W
                </span>
              </>
            )}
            {streaks.currentStreak < 0 && (
              <>
                <span className="text-2xl">🧊</span>
                <span className="text-4xl font-bold text-[var(--error)]">
                  {Math.abs(streaks.currentStreak)}L
                </span>
              </>
            )}
            {streaks.currentStreak === 0 && (
              <>
                <span className="text-4xl font-bold text-[var(--muted)]">-</span>
              </>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--muted)]">Racha Actual</p>
        </div>
      </div>

      {/* Form Section */}
      {recentForm && recentForm.recentMatches > 0 && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--ink)]">
            Form (Últimos {recentForm.recentMatches} partidos)
          </h3>
          <div className="mb-3 flex items-center gap-4">
            <span className="text-sm text-[var(--muted)]">
              Win Rate: <span className="font-semibold text-[var(--ink)]">
                {(recentForm.winRate * 100).toFixed(0)}%
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                recentForm.formIndicator === "hot"
                  ? "bg-[color:var(--success)] text-white"
                  : recentForm.formIndicator === "cold"
                  ? "bg-[color:var(--error)] text-white"
                  : "bg-[color:var(--muted)] text-white"
              }`}
            >
              {recentForm.formIndicator === "hot" && "🔥 Caliente"}
              {recentForm.formIndicator === "cold" && "🧊 Frío"}
              {recentForm.formIndicator === "neutral" && "⚖️ Neutral"}
            </span>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {recentForm.wins} victorias, {recentForm.losses} derrotas
            {recentForm.streak && (
              <span className="ml-2">
                - Racha: {recentForm.streak.count} {" "}
                {recentForm.streak.type === "win" ? "ganadas" : "perdidas"}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Trend Analysis Section */}
      {(eloTimeline.length > 0) && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--ink)]">
            Historial ELO
          </h3>
          <div className="h-64">
            {eloChartData.length > 0 ? (
              <TradingViewChart
                data={eloChartData}
                hiddenPlayers={new Set()}
              />
            ) : (
              <p className="text-[var(--muted)]">No hay datos de ELO</p>
            )}
          </div>
        </div>
      )}

      {/* Win Rate Trend */}
      {winRateChartData && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
              Tendencia de Win Rate
            </h3>
            {winRateTrend && (
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  winRateTrend.trendDirection === "up"
                    ? "text-[var(--success)]"
                    : winRateTrend.trendDirection === "down"
                    ? "text-[var(--error)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {winRateTrend.trendDirection === "up" && "↗️ Mejorando"}
                {winRateTrend.trendDirection === "down" && "↘️ Descendiendo"}
                {winRateTrend.trendDirection === "neutral" && "→ Estable"}
              </span>
            )}
          </div>
          <div className="h-64">
            <TradingViewChart
              data={[{
                playerId: playerId,
                name: playerName,
                status: "usual",
                points: winRateTrend?.trend.map(t => ({ date: t.period, rating: Math.round(t.winRate * 100) })) || []
              }]}
              hiddenPlayers={new Set()}
            />
          </div>
        </div>
      )}

      {/* Best Pairings Section */}
      {topPairs.length > 0 && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--ink)]">
            Mejores Parejas
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topPairs.map((pair) => (
              <Link
                key={pair.partnerId}
                href={`/g/${groupSlug}/compare?player1=${playerId}&player2=${pair.partnerId}`}
                className="block rounded-lg border border-[color:var(--card-border-weak)] bg-[color:var(--card-surface)] p-4 transition-colors hover:border-[color:var(--accent)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--muted)]">
                    {pair.partnerName}
                  </span>
                  {pair.partnerStatus === "invited" && (
                    <span className="rounded-full bg-[color:var(--muted)] px-1.5 py-0.5 text-xs text-white">
                      Invitado
                    </span>
                  )}
                </div>
                <div className="mb-2 text-3xl font-bold text-[var(--accent)]">
                  {(pair.winRate * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {pair.matchesPlayed} partidos jugados
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Opponent Analysis Section */}
      {topOpponents.length > 0 && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--ink)]">
            Análisis de Oponentes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--card-border-weak)]">
                  <th className="pb-3 font-semibold text-[var(--ink)]">Oponente</th>
                  <th className="pb-3 font-semibold text-[var(--ink)]">PJ</th>
                  <th className="pb-3 font-semibold text-[var(--ink)]">W-L</th>
                  <th className="pb-3 font-semibold text-[var(--ink)]">Win Rate</th>
                  <th className="pb-3 font-semibold text-[var(--ink)]">Último</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {topOpponents.map((opp) => (
                  <tr
                    key={opp.opponentId}
                    className="border-b border-[color:var(--card-border-weak)] last:border-0"
                  >
                    <td className="py-3">
                      <span className="font-medium text-[var(--ink)]">
                        {opp.opponentName}
                      </span>
                      {opp.opponentStatus === "invited" && (
                        <span className="ml-2 rounded-full bg-[color:var(--muted)] px-1.5 py-0.5 text-xs text-white">
                          Invitado
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[var(--muted)]">
                      {opp.totalMatches}
                    </td>
                    <td className="py-3">
                      <span className="text-[var(--success)]">{opp.wins}</span>
                      -
                      <span className="text-[var(--error)]">{opp.losses}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`font-semibold ${
                          opp.winRate >= 0.6
                            ? "text-[var(--success)]"
                            : opp.winRate >= 0.4
                            ? "text-[var(--warning)]"
                            : "text-[var(--error)]"
                        }`}
                      >
                        {(opp.winRate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 text-[var(--muted)]">
                      {formatDate(opp.lastPlayedAt)}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/g/${groupSlug}/compare?player1=${playerId}&player2=${opp.opponentId}`}
                        className="text-sm text-[var(--accent)] hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Streaks Section */}
      {(streaks.longestWinStreak > 0 || streaks.longestLossStreak > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Best Win Streak */}
          {streaks.longestWinStreak > 0 && (
            <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                  Mejor Racha de Victorias
                </h3>
              </div>
              <div className="mb-2 text-4xl font-bold text-[var(--success)]">
                {streaks.longestWinStreak}W
              </div>
              {streaks.streakHistory.length > 0 && (
                <p className="text-sm text-[var(--muted)]">
                  {(() => {
                    const bestWinStreak = streaks.streakHistory
                      .filter((s) => s.type === "win")
                      .sort((a, b) => b.streak - a.streak)[0];
                    if (bestWinStreak) {
                      return `${formatDate(bestWinStreak.startDate, "long")} - ${formatDate(bestWinStreak.endDate, "long")}`;
                    }
                    return null;
                  })()}
                </p>
              )}
            </div>
          )}

          {/* Worst Loss Streak */}
          {streaks.longestLossStreak > 0 && (
            <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">📉</span>
                <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                  Peor Racha de Derrotas
                </h3>
              </div>
              <div className="mb-2 text-4xl font-bold text-[var(--error)]">
                {streaks.longestLossStreak}L
              </div>
              {streaks.streakHistory.length > 0 && (
                <p className="text-sm text-[var(--muted)]">
                  {(() => {
                    const worstLossStreak = streaks.streakHistory
                      .filter((s) => s.type === "loss")
                      .sort((a, b) => b.streak - a.streak)[0];
                    if (worstLossStreak) {
                      return `${formatDate(worstLossStreak.startDate, "long")} - ${formatDate(worstLossStreak.endDate, "long")}`;
                    }
                    return null;
                  })()}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Achievements Section */}
      {achievements.unlocked.length > 0 && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-[var(--ink)]">
            Logros
          </h3>
          <AchievementsSection
            unlocked={achievements.unlocked}
            locked={achievements.locked}
          />
        </div>
      )}

      {/* No Data Message */}
      {!hasMatches && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-8 text-center">
          <p className="text-[var(--muted)]">
            {playerName} aún no ha jugado partidos.
          </p>
        </div>
      )}
    </div>
  );
}
