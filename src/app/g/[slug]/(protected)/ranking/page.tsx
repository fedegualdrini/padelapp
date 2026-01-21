import { notFound } from "next/navigation";
import { TradingViewRankingLayout } from "@/components/TradingViewRankingLayout";
import { getEloTimeline, getGroupBySlug } from "@/lib/data";

type RankingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RankingPage({ params }: RankingPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const timeline = await getEloTimeline(group.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Evolucion
        </p>
        <h2 className="font-display text-2xl text-[var(--ink)]">Ranking</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Seguimiento histórico de ELO por jugador.
        </p>
      </div>

      <TradingViewRankingLayout data={timeline} />
    </div>
  );
}
