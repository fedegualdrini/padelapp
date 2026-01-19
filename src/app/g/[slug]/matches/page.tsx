import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import { getGroupBySlug, getMatches } from "@/lib/data";

type MatchesPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MatchesPage({ params }: MatchesPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member

  const matches = await getMatches(group.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Registro de partidos
          </p>
          <h2 className="font-display text-2xl text-[var(--ink)]">
            Todos los partidos
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
            Filtrar
          </button>
          <Link
            href={`/g/${slug}/matches/new`}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Nuevo partido
          </Link>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 text-sm text-[var(--muted)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          No hay partidos. Cargá el primero para empezar a medir.
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} basePath={`/g/${slug}`} {...match} />
          ))}
        </div>
      )}
    </div>
  );
}
