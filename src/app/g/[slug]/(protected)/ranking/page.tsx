import { notFound } from "next/navigation";
import { TradingViewRankingLayout } from "@/components/TradingViewRankingLayout";
import { getEloTimeline, getGroupBySlug } from "@/lib/data";
import PeriodSelector, { parsePeriodFromParams } from "@/components/PeriodSelector";

type RankingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RankingPage({ params, searchParams }: RankingPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const period = parsePeriodFromParams(new URLSearchParams(sp as Record<string, string>));
  const { preset, startDate, endDate } = period.preset === 'custom' ? period : { preset: period.preset, startDate: undefined, endDate: undefined };

  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const timeline = await getEloTimeline(group.id, startDate, endDate);

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
        <PeriodSelector />
      </div>

      <TradingViewRankingLayout data={timeline} />
    </div>
  );
}
