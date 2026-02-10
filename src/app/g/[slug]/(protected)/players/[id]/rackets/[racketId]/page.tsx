import Link from "next/link";
import { notFound } from "next/navigation";

import { getGroupBySlug } from "@/lib/data";
import { getRacketWithStats } from "@/lib/racket-data";
import { RacketCard } from "../RacketClientComponents";

type RacketDetailsPageProps = {
  params: Promise<{ slug: string; id: string; racketId: string }>;
};

export default async function RacketDetailsPage({ params }: RacketDetailsPageProps) {
  const { slug, id: playerId, racketId } = await params;

  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  const racket = await getRacketWithStats(racketId, group.id);
  if (!racket) notFound();

  // Prevent cross-player access via URL guessing
  if (racket.player_id !== playerId) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/g/${slug}/players/${playerId}/rackets`}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Volver a paletas
        </Link>
        <h2 className="font-display text-2xl text-[var(--ink)]">Detalle de paleta</h2>
        <p className="text-sm text-[var(--muted)]">Información y rendimiento.</p>
      </header>

      <section className="max-w-xl">
        <RacketCard
          racket={{
            id: racket.id,
            brand: racket.brand,
            model: racket.model,
            weight: racket.weight,
            stats: racket.stats
              ? {
                  matches_played: racket.stats.matches_played,
                  win_rate: racket.stats.win_rate,
                  elo_change: racket.stats.elo_change,
                }
              : null,
          }}
          onClick={() => {}}
        />

        <div className="mt-4 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Detalles</h3>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">Marca</dt>
              <dd className="font-semibold text-[var(--ink)]">{racket.brand}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Modelo</dt>
              <dd className="font-semibold text-[var(--ink)]">{racket.model}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Peso</dt>
              <dd className="font-semibold text-[var(--ink)]">
                {racket.weight ? `${racket.weight}g` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Balance</dt>
              <dd className="font-semibold text-[var(--ink)]">{racket.balance ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Fecha de compra</dt>
              <dd className="font-semibold text-[var(--ink)]">{racket.purchase_date ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Activa</dt>
              <dd className="font-semibold text-[var(--ink)]">{racket.is_active ? "Sí" : "No"}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
