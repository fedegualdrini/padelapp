import { getGroupBySlug, getPlayers, getHeadToHeadStats } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import PlayerSelector from "./PlayerSelector";

type ComparePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ playerA?: string; playerB?: string }>;
};

export default async function ComparePage({
  params,
  searchParams,
}: ComparePageProps) {
  const { slug } = await params;
  const { playerA, playerB } = await searchParams;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const players = await getPlayers(group.id);
  const usualPlayers = players.filter((p) => p.status === "usual");

  let stats = null;
  if (playerA && playerB && playerA !== playerB) {
    stats = await getHeadToHeadStats(group.id, playerA, playerB);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Comparación
        </p>
        <h2 className="font-display text-2xl text-[var(--ink)]">
          Head to Head
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Compará el rendimiento entre dos jugadores cuando se enfrentan.
        </p>
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">
          Seleccionar jugadores
        </h3>
        <PlayerSelector
          players={usualPlayers}
          slug={slug}
          playerA={playerA}
          playerB={playerB}
        />
      </section>

      {!stats && playerA && playerB && (
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <p className="text-sm text-[var(--muted)]">
            Seleccioná dos jugadores diferentes para ver su historial
          </p>
        </div>
      )}

      {stats && stats.totalMatches === 0 && (
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <p className="text-lg font-semibold text-[var(--ink)]">
            Sin enfrentamientos
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {stats.playerA.name} y {stats.playerB.name} nunca se enfrentaron como rivales.
          </p>
        </div>
      )}

      {stats && stats.totalMatches > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Player A Stats */}
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--accent)]/10 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
              <p className="text-sm font-semibold text-[var(--accent)]">
                {stats.playerA.name}
              </p>
              <p className="mt-3 text-4xl font-bold text-[var(--ink)]">
                {stats.playerA.wins}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Victorias
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {stats.playerA.setsWon}
                  </p>
                  <p className="text-xs text-[var(--muted)]">Sets ganados</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {Math.round(
                      (stats.playerA.wins / stats.totalMatches) * 100
                    )}
                    %
                  </p>
                  <p className="text-xs text-[var(--muted)]">Win rate</p>
                </div>
              </div>
            </div>

            {/* Total Matches */}
            <div className="flex items-center justify-center rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="text-center">
                <p className="text-5xl font-bold text-[var(--ink)]">
                  {stats.totalMatches}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Partidos
                </p>
              </div>
            </div>

            {/* Player B Stats */}
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--gold)]/10 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
              <p className="text-sm font-semibold text-[var(--gold)]">
                {stats.playerB.name}
              </p>
              <p className="mt-3 text-4xl font-bold text-[var(--ink)]">
                {stats.playerB.wins}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Victorias
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {stats.playerB.setsWon}
                  </p>
                  <p className="text-xs text-[var(--muted)]">Sets ganados</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {Math.round(
                      (stats.playerB.wins / stats.totalMatches) * 100
                    )}
                    %
                  </p>
                  <p className="text-xs text-[var(--muted)]">Win rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Match History */}
          <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
            <h3 className="font-display text-lg text-[var(--ink)]">
              Historial de enfrentamientos
            </h3>
            <div className="mt-4 grid gap-3">
              {stats.matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/g/${slug}/matches/${match.id}`}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 transition hover:border-[color:var(--card-border-strong)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-[var(--muted)]">
                        {match.playedAt}
                      </p>
                      <p className="mt-1 font-semibold text-[var(--ink)]">
                        {match.playerATeam[0]} vs {match.playerBTeam[0]}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {match.score}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          match.winner === stats.playerA.name
                            ? "text-[var(--accent)]"
                            : "text-[var(--gold)]"
                        }`}
                      >
                        Ganó {match.winner}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="text-center">
        <Link
          href={`/g/${slug}/players`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Volver a jugadores
        </Link>
      </div>
    </div>
  );
}
