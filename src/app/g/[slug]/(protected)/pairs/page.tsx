import { getGroupBySlug, getPairAggregates, getPlayers } from "@/lib/data";
import { notFound } from "next/navigation";
import { parsePeriodFromParams } from "@/lib/period";
import PeriodSelector from "@/components/PeriodSelector";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

type PairsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PairsPage({ params, searchParams }: PairsPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const period = parsePeriodFromParams(new URLSearchParams(sp as Record<string, string>));
  const { preset, startDate, endDate } = period.preset === 'custom' ? period : { preset: period.preset, startDate: undefined, endDate: undefined };

  const group = await getGroupBySlug(slug);

  // Layout already verifies group exists and user is a member
  if (!group) {
    notFound();
  }

  const [pairStats, players] = await Promise.all([
    getPairAggregates(group.id, undefined, startDate, endDate),
    getPlayers(group.id),
  ]);
  const playerById = new Map(players.map((player) => [player.id, player.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Química
        </p>
        <h2 className="font-display text-2xl text-[var(--ink)]">Parejas</h2>
        <PeriodSelector />
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        {pairStats.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin estadísticas de parejas"
            description={
              period.preset !== 'all-time'
                ? 'No hay datos de parejas en este período. Probá con "Todo el tiempo" o jugá más partidos juntos.'
                : 'Las estadísticas de parejas aparecen cuando los mismos jugadores participan en partidos juntos.'
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pairStats.map((pair) => {
              const pairName = `${playerById.get(pair.player_a_id) ?? "-"} / ${
                playerById.get(pair.player_b_id) ?? "-"
              }`;
              return (
                <div
                  key={`${pair.player_a_id}-${pair.player_b_id}`}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-[var(--ink)]">
                      {pairName}
                    </p>
                    <span className="rounded-full bg-[var(--gold)]/20 px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                      {pair.matches_played} partidos
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {pair.wins}G - {pair.losses}P -{" "}
                    {Math.round((pair.win_rate ?? 0) * 100)}% de victorias
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
