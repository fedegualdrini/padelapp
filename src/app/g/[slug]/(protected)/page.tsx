import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import StatCard from "@/components/StatCard";
import { getEloLeaderboard, getGroupBySlug, getPulseStats, getRecentMatches, getTopStats } from "@/lib/data";

type GroupPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GroupDashboard({ params }: GroupPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member

  const [topStats, recentMatches, pulse, leaderboard] = await Promise.all([
    getTopStats(group.id),
    getRecentMatches(group.id, 3),
    getPulseStats(group.id),
    getEloLeaderboard(group.id),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {topStats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-[var(--ink)]">
              Últimos partidos
            </h2>
            <Link
              href={`/g/${slug}/matches`}
              className="text-sm font-semibold text-[var(--accent)]"
            >
              Ver todos &gt;
            </Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
              No hay partidos. Cargá el primero para ver estadísticas.
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
            <h3 className="font-display text-xl text-[var(--ink)]">
              Pulso de la semana
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Registraste {pulse.matches} partido
              {pulse.matches === 1 ? "" : "s"}, {pulse.sets} sets y{" "}
              {pulse.games} juegos en los últimos 7 días.
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Más mejoró
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
                  {topStats[2]?.value} ({topStats[2]?.sub})
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Pareja más jugada
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--ink)]">
                  {topStats[3]?.value} ({topStats[3]?.sub})
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <h3 className="font-display text-xl text-[var(--ink)]">
              Ranking ELO
            </h3>
            <div className="mt-4 grid gap-3">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Sin ELO todavía.
                </p>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.playerId}
                    className="flex items-center justify-between rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-base)] text-sm font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {entry.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--accent)]">
                      {entry.rating}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <h3 className="font-display text-xl text-[var(--ink)]">
              Acciones rápidas
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm font-semibold">
              <Link
                href={`/g/${slug}/matches/new`}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-center text-white"
              >
                Cargar partido
              </Link>
              <Link
                href={`/g/${slug}/players`}
                className="rounded-full border border-[var(--ink)]/10 bg-[color:var(--card-solid)] px-4 py-2 text-center text-[var(--ink)]"
              >
                Administrar jugadores
              </Link>
              <Link
                href={`/g/${slug}/pairs`}
                className="rounded-full border border-[var(--ink)]/10 bg-[color:var(--card-solid)] px-4 py-2 text-center text-[var(--ink)]"
              >
                Ver parejas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
