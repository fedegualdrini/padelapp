import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPlayerRacketsWithStats,
  getPlayerRacketInsights,
} from "@/lib/racket-data";
import { getGroupBySlug } from "@/lib/data";
import { AddRacketButton, CompareRacketsButton, RacketsList } from "./RacketClientComponents";

type PlayerRacketsPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function PlayerRacketsPage({
  params,
}: PlayerRacketsPageProps) {
  const { slug, id } = await params;

  // Fetch group first
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  // Fetch rackets data
  const [racketsWithStats, insights] = await Promise.all([
    getPlayerRacketsWithStats(id, group.id),
    getPlayerRacketInsights(id, group.id),
  ]);

  const rackets = racketsWithStats.map((r) => ({
    id: r.id,
    player_id: r.player_id,
    brand: r.brand,
    model: r.model,
    weight: r.weight,
    balance: r.balance,
    purchase_date: r.purchase_date,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
    stats: r.stats,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/g/${slug}/players/${id}`}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← Volver al perfil
          </Link>
          <h2 className="mt-2 font-display text-2xl text-[var(--ink)]">
            Rackets
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Track and analyze your racket performance
          </p>
        </div>
        <AddRacketButton onClick={() => {
          // This is handled by the modal system
          (window as { openAddRacketModal?: boolean }).openAddRacketModal = true;
        }} />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Insights</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight) => (
              <div
                key={`${insight.insight_type}-${insight.racket_id}`}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
              >
                <div className="flex items-center gap-2">
                  {insight.insight_type === "best_performing" && (
                    <svg
                      className="h-5 w-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {insight.insight_type === "most_used" && (
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  )}
                  {insight.insight_type === "aging_warning" && (
                    <svg
                      className="h-5 w-5 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  )}
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {insight.insight_type === "best_performing" && "Best Performing"}
                    {insight.insight_type === "most_used" && "Most Used"}
                    {insight.insight_type === "aging_warning" && "Aging Warning"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  {insight.insight_text}
                </p>
                {insight.racket_id && (
                  <Link
                    href={`/g/${slug}/players/${id}/rackets/${insight.racket_id}`}
                    className="mt-2 block text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    View details →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rackets List */}
      {rackets.length === 0 ? (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <svg
            className="mx-auto h-16 w-16 text-[var(--muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <h3 className="mt-4 font-display text-lg text-[var(--ink)]">
            No rackets yet
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Add your first racket to start tracking your performance by equipment
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg text-[var(--ink)]">
              Your Rackets ({rackets.length})
            </h3>
            {rackets.length >= 2 && (
              <CompareRacketsButton onClick={() => {
                (window as { openCompareRacketsModal?: boolean }).openCompareRacketsModal = true;
              }} />
            )}
          </div>
          <RacketsList rackets={rackets} slug={slug} playerId={id} />
        </section>
      )}
    </div>
  );
}
