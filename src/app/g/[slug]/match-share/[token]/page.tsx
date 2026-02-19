import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Trophy, TrendingUp, TrendingDown, Calendar, Users } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import ShareMatchTracker from "./ShareMatchTracker";

// This route is used for bot screenshots; keep it always fresh.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ShareMatchPageProps = {
  params: Promise<{ slug: string; token: string }>;
};

export async function generateMetadata({ params }: ShareMatchPageProps) {
  const { slug, token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: matchData, error } = await supabase.rpc("get_public_match_details", {
    p_slug: slug,
    p_token: token,
  });

  if (error || !matchData || matchData.length === 0) {
    return {
      title: "Partido no encontrado",
      description: "El enlace para compartir el partido no es válido o ha expirado.",
    };
  }

  const match = matchData[0] as any;

  return {
    title: `${match.team1_name} vs ${match.team2_name} | Resultado del Partido`,
    description: `Resultado del partido: ${match.team1_name} ${match.team1_score} - ${match.team2_score} ${match.team2_name}. Mejor de ${match.best_of}.`,
    openGraph: {
      title: `${match.team1_name} ${match.team1_score} - ${match.team2_score} ${match.team2_name}`,
      description: `Resultado del partido de pádel. Mejor de ${match.best_of} sets.`,
      type: "website",
      siteName: "Padelapp",
      images: [
        {
          url: `/api/og/match/${slug}/${token}`,
          width: 1200,
          height: 630,
          alt: `${match.team1_name} vs ${match.team2_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${match.team1_name} ${match.team1_score} - ${match.team2_score} ${match.team2_name}`,
      description: `Resultado del partido de pádel`,
    },
  };
}

export default async function ShareMatchPage({ params }: ShareMatchPageProps) {
  const { slug, token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: matchData, error } = await supabase.rpc("get_public_match_details", {
    p_slug: slug,
    p_token: token,
  });

  if (error || !matchData || matchData.length === 0) {
    notFound();
  }

  const match = matchData[0] as any;

  // Determine the winning team
  const winner = match.team1_score > match.team2_score ? match.team1_name :
                 match.team2_score > match.team1_score ? match.team2_name : null;

  // Parse sets and ELO deltas
  const team1Sets = match.team1_sets || [];
  const team2Sets = match.team2_sets || [];
  const eloDeltas = match.elo_deltas || [];

  // Format date
  const matchDate = new Date(match.played_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          <Calendar className="h-4 w-4" />
          {matchDate}
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 md:gap-8">
          {/* Team 1 */}
          <div className="flex-1 text-right">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--ink)]">
              {match.team1_name}
            </h1>
          </div>

          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-display text-4xl md:text-5xl font-bold text-[var(--ink)]">
                {match.team1_score}
              </div>
              <div className="text-xs text-[var(--muted)]">-</div>
              <div className="font-display text-4xl md:text-5xl font-bold text-[var(--ink)]">
                {match.team2_score}
              </div>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-left">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--ink)]">
              {match.team2_name}
            </h1>
          </div>
        </div>

        {winner && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)]/10 px-4 py-2">
            <Trophy className="h-5 w-5 text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--accent)]">
              Ganador: {winner}
            </span>
          </div>
        )}

        {/* Sets */}
        <div className="mb-6">
          <h3 className="font-display text-lg font-semibold text-[var(--ink)] mb-3">
            Sets
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {/* Team 1 Sets */}
            <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
              <p className="text-sm font-semibold text-[var(--ink)] mb-2">
                {match.team1_name}
              </p>
              <div className="flex flex-wrap gap-2">
                {team1Sets.map((set: any, index: number) => (
                  <span
                    key={`t1-set-${index}`}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      set.games > set.opponent
                        ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                        : "bg-[var(--bg-base)] text-[var(--muted)]"
                    }`}
                  >
                    {set.games}-{set.opponent}
                  </span>
                ))}
              </div>
            </div>

            {/* Team 2 Sets */}
            <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
              <p className="text-sm font-semibold text-[var(--ink)] mb-2">
                {match.team2_name}
              </p>
              <div className="flex flex-wrap gap-2">
                {team2Sets.map((set: any, index: number) => (
                  <span
                    key={`t2-set-${index}`}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      set.games > set.opponent
                        ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                        : "bg-[var(--bg-base)] text-[var(--muted)]"
                    }`}
                  >
                    {set.games}-{set.opponent}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ELO Deltas */}
        {eloDeltas.length > 0 && (
          <div>
            <h3 className="font-display text-lg font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Variación de ELO
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {eloDeltas.map((player: any, index: number) => (
                <div
                  key={`elo-${index}`}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--ink)] mb-1">
                    {player.name}
                  </p>
                  <p className="text-xs text-[var(--muted)] mb-2">
                    {player.previous} → {player.current}
                  </p>
                  <div
                    className={`flex items-center gap-1 text-base font-bold ${
                      player.delta >= 0
                        ? "text-[var(--accent)]"
                        : "text-rose-400"
                    }`}
                  >
                    {player.delta >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {player.delta >= 0 ? "+" : ""}
                    {player.delta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--muted)]">
        <p>Compartido desde Padelapp</p>
        <p className="mt-1">
          <a
            href={`https://padel.app`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            Crea tu propio ranking
          </a>
        </p>
      </div>

      <ShareMatchTracker matchId={match.match_id.toString()} slug={slug} />
    </div>
  );
}
