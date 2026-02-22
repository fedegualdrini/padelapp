import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import NextMatchCardClient from "./NextMatchCardClient";
import {
  getAttendanceSummary,
  getEloLeaderboard,
  getGroupBySlug,
  getPlayers,
  getRecentMatches,
  getUpcomingOccurrences,
  getWeeklyEvents,
} from "@/lib/data";

type GroupPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: GroupPageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  return {
    title: group ? `Dashboard — ${group.name}` : "Group Dashboard",
    description: group
      ? `View recent matches, ELO rankings, and upcoming games for ${group.name}.`
      : "Group dashboard with matches and rankings.",
  };
}

export default async function GroupDashboard({ params }: GroupPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member
  if (!group) {
    notFound();
  }

  // Keep the dashboard focused on the weekly flow.
  const [weeklyEvents, upcomingOccurrences, players, recentMatches, leaderboard] = await Promise.all([
    getWeeklyEvents(group.id),
    getUpcomingOccurrences(group.id, 1),
    getPlayers(group.id),
    getRecentMatches(group.id, 3),
    getEloLeaderboard(group.id),
  ]);

  const upcomingSummaries = await getAttendanceSummary(group.id, upcomingOccurrences, weeklyEvents);
  const nextSummary = upcomingSummaries[0] ?? null;

  return (
    <div className="flex flex-col gap-8">
      <NextMatchCardClient slug={slug} summary={nextSummary} players={players} />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-xl sm:text-2xl text-[var(--ink)]">Últimos partidos</h3>
            <Link href={`/g/${slug}/matches`} className="text-xs sm:text-sm font-semibold text-[var(--accent)] whitespace-nowrap">
              Ver todos &gt;
            </Link>
          </div>

          {recentMatches.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 sm:p-6 md:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
                <div className="text-4xl sm:text-5xl">🎾</div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--ink)]">
                    ¡Tu grupo está listo!
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--muted)] px-4">
                    Registra tu primer partido y empezá a medir el rendimiento de tu equipo.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
                  <Link
                    href={`/g/${slug}/matches/new`}
                    className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90 min-h-[44px] flex items-center justify-center"
                  >
                    Registrar primer partido
                  </Link>
                  <Link
                    href={`/g/${slug}/players`}
                    className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)]/80 min-h-[44px] flex items-center justify-center"
                  >
                    Invitar amigos
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentMatches.map((match) => (
                <MatchCard key={match.id} basePath={`/g/${slug}`} {...match} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 sm:p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg sm:text-xl text-[var(--ink)]">Ranking ELO</h3>
              <Link href={`/g/${slug}/ranking`} className="text-xs sm:text-sm font-semibold text-[var(--accent)] whitespace-nowrap">
                Ver ranking &gt;
              </Link>
            </div>

            <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3">
              {leaderboard.length === 0 ? (
                <p className="text-xs sm:text-sm text-[var(--muted)]">Sin ELO todavía.</p>
              ) : (
                leaderboard.slice(0, 8).map((entry, index) => (
                  <div
                    key={entry.playerId}
                    className="flex items-center justify-between rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 sm:px-4 py-2.5 sm:py-3"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[var(--bg-base)] text-xs sm:text-sm font-semibold shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-[var(--ink)] truncate">{entry.name}</p>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-[var(--accent)] shrink-0">{entry.rating}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 sm:p-5 text-xs sm:text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <p className="font-semibold text-[var(--ink)]">Core loop</p>
            <p className="mt-1">Asistencia → equipos → score → ranking. El resto está en Beta/Labs.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
