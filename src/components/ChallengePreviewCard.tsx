import Link from "next/link";

type ChallengePreviewCardProps = {
  basePath: string;
  hasActiveChallenge?: boolean;
  challengeTitle?: string;
  challengeDescription?: string;
};

export default function ChallengePreviewCard({
  basePath,
  hasActiveChallenge = false,
  challengeTitle = "Desafío Semanal",
  challengeDescription = "Participá en el desafío de esta semana para subir de nivel.",
}: ChallengePreviewCardProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="trophy">
            🏆
          </span>
          <h3 className="font-display text-xl text-[var(--ink)]">Desafíos</h3>
        </div>
        <Link
          href={`${basePath}/challenges`}
          className="text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          Ver todos &gt;
        </Link>
      </div>

      <div className="mt-4">
        {hasActiveChallenge ? (
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">{challengeTitle}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{challengeDescription}</p>
            <Link
              href={`${basePath}/challenges`}
              className="mt-3 inline-flex items-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              Ver mi progreso
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[var(--muted)]">Participá en los desafíos semanales para ganar insignias especiales y subir en el ranking.</p>
            <Link
              href={`${basePath}/challenges`}
              className="mt-3 inline-flex items-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              Explorar desafíos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
