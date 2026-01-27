'use client';

import { useRouter } from 'next/navigation';

type MatchTeam = {
  name: string;
  players?: { id: string; name: string }[];
  sets: number[];
  opponentSets: number[];
};

type MatchCardProps = {
  id: string;
  playedAt: string;
  bestOf: number;
  createdBy: string;
  updatedBy?: string | null;
  teams: readonly MatchTeam[];
  winner: string;
  basePath?: string;
};

export default function MatchCard({
  id,
  playedAt,
  bestOf,
  createdBy,
  updatedBy,
  teams,
  winner,
  basePath = "",
}: MatchCardProps) {
  const router = useRouter();
  const matchHref = `${basePath}/matches/${id}`;
  const matchesListHref = `${basePath}/matches`;

  const effectiveUpdatedBy = (updatedBy ?? "").trim();
  const isEdited = Boolean(effectiveUpdatedBy) && effectiveUpdatedBy !== createdBy;
  const attributionLabel = isEdited ? "Editado por" : "Creado por";
  const attributionName = isEdited ? effectiveUpdatedBy : createdBy;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(matchHref)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(matchHref);
        }
      }}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur transition hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {playedAt} - Mejor de {bestOf}
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{winner}</p>
        </div>
        <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
          {attributionLabel} {attributionName}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <div
            key={team.name}
            className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-3"
          >
            <div className="flex flex-wrap items-center gap-1">
              {(team.players ?? []).length > 0 ? (
                team.players!.map((p, idx) => (
                  <span key={p.id} className="text-sm font-semibold text-[var(--ink)]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`${matchesListHref}?playerId=${encodeURIComponent(p.id)}`);
                      }}
                      className="rounded-md px-1 py-0.5 hover:bg-[var(--bg-base)] hover:underline"
                    >
                      {p.name}
                    </button>
                    {idx < team.players!.length - 1 ? <span className="text-[var(--muted)]"> / </span> : null}
                  </span>
                ))
              ) : (
                <p className="text-sm font-semibold text-[var(--ink)]">{team.name}</p>
              )}
            </div>
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
    </div>
  );
}

