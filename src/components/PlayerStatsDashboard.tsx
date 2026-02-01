"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import AchievementsSection, { Achievement } from "./AchievementsSection";
import type { EloTimelinePoint } from "@/lib/data";
import type {
  PlayerStreaks,
} from "@/lib/streaks";
import type { PartnerStat } from "@/lib/data";
import type { OpponentRecord } from "@/lib/data";
import type { PlayerForm } from "@/lib/data";
import type { WinRateTrend } from "@/lib/data";

// FIX: Dynamically import heavy chart component to reduce initial bundle size
const TradingViewChart = dynamic(
  () => import("./TradingViewChart").then((mod) => ({ default: mod.TradingViewChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64 text-[var(--muted)]">
        <div className="text-center">
          <p className="text-sm font-medium">Loading chart...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

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
  const rankPosition = null;

  const topPairs = partnerStats
    .filter((p) => p.matchesPlayed >= 3)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  const topOpponents = [...opponentRecords]
    .sort((a, b) => b.totalMatches - a.totalMatches)
    .slice(0, 5);

  const eloChartData = eloTimeline.length > 0 ? [
    {
      playerId: playerId,
      name: playerName,
      status: "usual",
      points: eloTimeline,
    }
  ] : [];

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
              <span className="text-4xl font-bold text-[var(--muted)]">-</span>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--muted)]">Racha Actual</p>
        </div>
      </div>

      {/* ELO Chart */}
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
      {winRateTrend && (
        <div className="rounded-lg border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
              Tendencia de Win Rate
            </h3>
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
    </div>
  );
}
