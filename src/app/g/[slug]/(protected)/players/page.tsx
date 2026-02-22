import type { Metadata } from "next";
import { getGroupBySlug, getPlayers, getPlayerStats } from "@/lib/data";
import { notFound } from "next/navigation";
import PlayerDirectory from "@/components/PlayerDirectory";
import { parsePeriodFromParams } from "@/lib/period";
import { hasSupabaseEnv } from "@/lib/supabase/server";

type PlayersPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PlayersPageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  return {
    title: group ? `Players — ${group.name}` : "Players",
    description: group
      ? `View all players in ${group.name}. Track individual stats, win rates, and performance.`
      : "View all players in the group.",
  };
}

export default async function PlayersPage({ params, searchParams }: PlayersPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const qRaw = sp.q;
  const statusRaw = sp.status;

  const q = typeof qRaw === "string" ? qRaw : undefined;

  const allowedStatuses = ["all", "usual", "invite"] as const;
  type AllowedStatus = (typeof allowedStatuses)[number];

  const status =
    typeof statusRaw === "string" && allowedStatuses.includes(statusRaw as AllowedStatus)
      ? (statusRaw as AllowedStatus)
      : undefined;

  const period = parsePeriodFromParams(new URLSearchParams(sp as Record<string, string>));
  const { startDate, endDate } =
    period.preset === "custom" ? period : { startDate: undefined, endDate: undefined };

  const group = await getGroupBySlug(slug);
  if (!group) {
    notFound();
  }

  const [players, stats] = await Promise.all([
    getPlayers(group.id),
    getPlayerStats(group.id, startDate, endDate),
  ]);

  // Demo mode: avoid client-side Supabase usage in PlayerDirectory.
  if (!hasSupabaseEnv() && slug === "demo") {
    const statsByPlayer = new Map(stats.map((s) => [s.player_id, s]));

    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Grupo</p>
          <h2 className="font-display text-2xl text-[var(--ink)]">Jugadores</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Demo mode: listado estático (sin acciones).
          </p>
        </div>

        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="grid gap-3">
            {players.map((p) => {
              const s = statsByPlayer.get(p.id) as
                | { matches_played?: number; win_rate?: number }
                | undefined;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{p.name}</p>
                    <p className="text-xs text-[var(--muted)]">{p.status}</p>
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    <p>Partidos: {s?.matches_played ?? 0}</p>
                    <p>Win rate: {s?.win_rate ?? 0}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PlayerDirectory
      groupId={group.id}
      groupSlug={group.slug}
      players={players}
      stats={stats}
      q={q}
      status={status}
      period={period}
    />
  );
}
