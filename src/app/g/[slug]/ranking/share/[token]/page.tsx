import { notFound } from "next/navigation";
import { TradingViewRankingLayout } from "@/components/TradingViewRankingLayout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ShareRankingPageProps = {
  params: Promise<{ slug: string; token: string }>;
};

type Row = {
  player_id: string;
  player_name: string;
  player_status: "usual" | "invite";
  played_at: string;
  rating: number;
};

type EloTimelinePoint = { date: string; rating: number };

type EloTimelineSeries = {
  playerId: string;
  name: string;
  status: "usual" | "invite";
  points: EloTimelinePoint[];
};

export default async function ShareRankingPage({ params }: ShareRankingPageProps) {
  const { slug, token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_ranking_timeline", {
    p_slug: slug,
    p_token: token,
  });

  if (error || !data) {
    notFound();
  }

  const rows = data as unknown as Row[];
  if (rows.length === 0) {
    // invalid token OR group has no ELO rows yet
    notFound();
  }

  const seriesByPlayer = new Map<string, EloTimelineSeries>();
  for (const r of rows) {
    const existing = seriesByPlayer.get(r.player_id);
    if (!existing) {
      seriesByPlayer.set(r.player_id, {
        playerId: r.player_id,
        name: r.player_name,
        status: r.player_status,
        points: [{ date: r.played_at, rating: r.rating }],
      });
    } else {
      existing.points.push({ date: r.played_at, rating: r.rating });
    }
  }

  const timeline = Array.from(seriesByPlayer.values());

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
