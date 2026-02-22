import type { Metadata } from "next";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import ClearMatchHistoryButton from "@/components/ClearMatchHistoryButton";
import MatchFiltersButton from "@/components/MatchFiltersButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getGroupBySlug, getMatches, getPlayers } from "@/lib/data";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";

type MatchesPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: MatchesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  return {
    title: group ? `Matches — ${group.name}` : "Matches",
    description: group
      ? `View and manage all padel matches for ${group.name}. Track scores and game history.`
      : "View and manage padel matches.",
  };
}

const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function MatchesPage({ params, searchParams }: MatchesPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const playerIdRaw = sp.playerId;
  const fromRaw = sp.from;
  const toRaw = sp.to;

  const playerId = typeof playerIdRaw === 'string' ? playerIdRaw : undefined;
  const from = typeof fromRaw === 'string' && isIsoDate(fromRaw) ? fromRaw : undefined;
  const to = typeof toRaw === 'string' && isIsoDate(toRaw) ? toRaw : undefined;

  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member
  if (!group) {
    notFound();
  }

  const [matches, players] = await Promise.all([
    getMatches(group.id, { playerId, from, to }),
    getPlayers(group.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Registro de partidos
          </p>
          <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)]">
            Todos los partidos
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <MatchFiltersButton players={players.map((p) => ({ id: p.id, name: p.name }))} />
          <ClearMatchHistoryButton slug={slug} />
          <Link
            href={`/g/${slug}/matches/new`}
            className="rounded-full bg-[var(--accent)] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white min-h-[44px] flex items-center"
          >
            Nuevo partido
          </Link>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Aún no hay partidos"
          description="Cargá el primer partido para empezar a medir el rendimiento del grupo."
          action={{
            label: "Crear primer partido",
            href: `/g/${slug}/matches/new`,
          }}
        />
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
