import Link from "next/link";
import { redirect } from "next/navigation";
import { getGroupBySlug, getMatchById, getMatchEloDeltas } from "@/lib/data";

type MatchPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const { slug, id } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member

  const [match, eloDeltas] = await Promise.all([
    getMatchById(group.id, id),
    getMatchEloDeltas(id),
  ]);

  if (!match) {
    return (
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        Partido no encontrado.{" "}
        <Link href={`/g/${slug}/matches`} className="font-semibold text-[var(--accent)]">
          Volver a partidos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {match.playedAt} - Mejor de {match.bestOf}
          </p>
          <h2 className="font-display text-2xl text-[var(--ink)]">
            {match.teams[0].name} vs {match.teams[1].name}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cargado por {match.createdBy}
          </p>
        </div>
        <Link
          href={`/g/${slug}/matches/${match.id}/edit`}
          className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
        >
          Editar partido
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">Marcador</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {match.teams.map((team) => (
            <div
              key={team.name}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
            >
              <p className="text-base font-semibold text-[var(--ink)]">
                {team.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {team.sets.map((score, index) => (
                  <span
                    key={`${team.name}-${index}`}
                    className="rounded-full bg-[var(--bg-base)] px-2 py-1"
                  >
                    {score}-{team.opponentSets[index]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">
          Variación de ELO
        </h3>
        {eloDeltas.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sin datos de ELO para este partido.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {eloDeltas.map((entry) => (
              <div
                key={entry.playerId}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {entry.name}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {entry.previous} → {entry.current}
                </p>
                <p
                  className={`mt-2 text-lg font-semibold ${
                    entry.delta >= 0
                      ? "text-[var(--accent)]"
                      : "text-rose-400"
                  }`}
                >
                  {entry.delta >= 0 ? "+" : ""}
                  {entry.delta} ELO
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
