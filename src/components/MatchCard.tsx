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

function PlayerInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

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

  const team1 = teams[0];
  const team2 = teams[1];

  const isTeam1Winner = Boolean(team1?.name) && team1?.name === winner;
  const isTeam2Winner = Boolean(team2?.name) && team2?.name === winner;

  // Calculate sets won
  const team1SetsWon = (team1?.sets ?? []).reduce(
    (acc, score, idx) => acc + (score > (team1?.opponentSets?.[idx] ?? 0) ? 1 : 0),
    0
  );
  const team2SetsWon = (team2?.sets ?? []).reduce(
    (acc, score, idx) => acc + (score > (team2?.opponentSets?.[idx] ?? 0) ? 1 : 0),
    0
  );

  const maxSets = Math.max(team1?.sets?.length ?? 0, team2?.sets?.length ?? 0, 1);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(matchHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(matchHref);
        }
      }}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(0,0,0,0.12)]"
    >
      {/* Header: Date and match info */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {playedAt}
          </span>
          <span className="text-xs text-[var(--muted)]">•</span>
          <span className="text-xs text-[var(--muted)]">
            Mejor de {bestOf}
          </span>
        </div>
        {isEdited && (
          <span className="rounded bg-[var(--bg-base)] px-2 py-0.5 text-xs text-[var(--muted)]">
            Editado
          </span>
        )}
      </div>

      {/* Score table - Tennis/padel style */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)]">
        {/* Header row with set numbers */}
        <div className="grid border-b border-[color:var(--card-border)] bg-[var(--bg-base)]" 
             style={{ gridTemplateColumns: `1fr repeat(${maxSets}, 2.5rem) 2.5rem` }}>
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Equipo
          </div>
          {(team1?.sets ?? []).map((_, idx) => (
            <div key={idx} className="flex items-center justify-center py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              S{idx + 1}
            </div>
          ))}
          <div className="flex items-center justify-center py-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Sets
          </div>
        </div>

        {/* Team 1 row */}
        <div className={`grid border-b border-[color:var(--card-border)] transition-colors ${isTeam1Winner ? 'bg-[#F2A900]/10' : ''}`}
             style={{ gridTemplateColumns: `1fr repeat(${maxSets}, 2.5rem) 2.5rem` }}>
          <div className="flex items-center gap-2 px-3 py-2.5">
            {/* Player avatars */}
            <div className="flex -space-x-1.5">
              {(team1?.players ?? []).slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`${matchesListHref}?playerId=${encodeURIComponent(p.id)}`);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--card-solid)] bg-[var(--accent)] text-xs font-bold text-white transition-transform hover:scale-110 hover:z-10"
                  title={p.name}
                >
                  {PlayerInitials(p.name)}
                </button>
              ))}
            </div>
            {/* Player names */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`truncate text-sm font-semibold ${isTeam1Winner ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                  {(team1?.players ?? []).map(p => p.name).join(' / ') || team1?.name || 'Equipo 1'}
                </span>
                {isTeam1Winner && (
                  <svg className="h-4 w-4 shrink-0 text-[#F2A900]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          {/* Set scores */}
          {(team1?.sets ?? []).map((score, idx) => {
            const opponentScore = team1?.opponentSets?.[idx] ?? 0;
            const wonGame = score > opponentScore;
            return (
              <div key={idx} className={`flex items-center justify-center py-2.5 text-sm font-semibold tabular-nums ${wonGame ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]'}`}>
                {score}
              </div>
            );
          })}
          {/* Sets won */}
          <div className={`flex items-center justify-center py-2.5 text-base font-bold tabular-nums ${isTeam1Winner ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
            {team1SetsWon}
          </div>
        </div>

        {/* Team 2 row */}
        <div className={`grid transition-colors ${isTeam2Winner ? 'bg-[#F2A900]/10' : ''}`}
             style={{ gridTemplateColumns: `1fr repeat(${maxSets}, 2.5rem) 2.5rem` }}>
          <div className="flex items-center gap-2 px-3 py-2.5">
            {/* Player avatars */}
            <div className="flex -space-x-1.5">
              {(team2?.players ?? []).slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`${matchesListHref}?playerId=${encodeURIComponent(p.id)}`);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--card-solid)] bg-[var(--bg-base)] text-xs font-bold text-[var(--ink)] transition-transform hover:scale-110 hover:z-10"
                  title={p.name}
                >
                  {PlayerInitials(p.name)}
                </button>
              ))}
            </div>
            {/* Player names */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`truncate text-sm font-semibold ${isTeam2Winner ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                  {(team2?.players ?? []).map(p => p.name).join(' / ') || team2?.name || 'Equipo 2'}
                </span>
                {isTeam2Winner && (
                  <svg className="h-4 w-4 shrink-0 text-[#F2A900]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          {/* Set scores */}
          {(team2?.sets ?? []).map((score, idx) => {
            const opponentScore = team2?.opponentSets?.[idx] ?? 0;
            const wonGame = score > opponentScore;
            return (
              <div key={idx} className={`flex items-center justify-center py-2.5 text-sm font-semibold tabular-nums ${wonGame ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]'}`}>
                {score}
              </div>
            );
          })}
          {/* Sets won */}
          <div className={`flex items-center justify-center py-2.5 text-base font-bold tabular-nums ${isTeam2Winner ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
            {team2SetsWon}
          </div>
        </div>
      </div>

      {/* Result indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isTeam1Winner && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F2A900] px-3 py-1 text-xs font-semibold text-[#1A1A1A]">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Victoria {team1SetsWon}-{team2SetsWon}
            </span>
          )}
          {isTeam2Winner && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F2A900] px-3 py-1 text-xs font-semibold text-[#1A1A1A]">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Victoria {team2SetsWon}-{team1SetsWon}
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
          Ver detalle →
        </div>
      </div>
    </div>
  );
}
