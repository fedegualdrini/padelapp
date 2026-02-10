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
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-[var(--ink)]">Últimos partidos</h3>
            <Link href={`/g/${slug}/matches`} className="text-sm font-semibold text-[var(--accent)]">
              Ver todos &gt;
            </Link>
          </div>

          {recentMatches.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
              No hay partidos. Cargá el primero para empezar.
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
          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-xl text-[var(--ink)]">Ranking ELO</h3>
              <Link href={`/g/${slug}/ranking`} className="text-sm font-semibold text-[var(--accent)]">
                Ver ranking &gt;
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Sin ELO todavía.</p>
              ) : (
                leaderboard.slice(0, 8).map((entry, index) => (
                  <div
                    key={entry.playerId}
                    className="flex items-center justify-between rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-base)] text-sm font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[var(--ink)]">{entry.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--accent)]">{entry.rating}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <p className="font-semibold text-[var(--ink)]">Core loop</p>
            <p className="mt-1">Asistencia → equipos → score → ranking. El resto está en Beta/Labs.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
