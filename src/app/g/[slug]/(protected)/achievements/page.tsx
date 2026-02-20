import { notFound } from "next/navigation";
import { getGroupBySlug } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AchievementsLeaderboard from "@/components/AchievementsLeaderboard";
import { BackButton, Heading } from "@/components/ui";

type AchievementsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AchievementsPage({ params }: AchievementsPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  // Fetch achievement leaderboard data
  const { data: achievements, error } = await supabase
    .from("achievements")
    .select(`
      player_id,
      achievement_key,
      unlocked_at,
      players!inner (id, name),
      achievement_definitions!inner (key, name, icon, rarity)
    `)
    .eq("players.group_id", group.id);

  if (error) {
    console.error("Error fetching achievements:", error);
  }

  // Aggregate by player
  const playerMap = new Map<
    string,
    {
      player_id: string;
      player_name: string;
      achievements_count: number;
      rarest_badge: {
        name: string;
        icon: string;
        rarity: "common" | "rare" | "epic" | "legendary";
      };
    }
  >();

  const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };

  interface AchievementRow {
    player_id: string;
    achievement_key: string;
    unlocked_at: string;
    players: { name: string };
    achievement_definitions: {
      key: string;
      name: string;
      icon: string;
      rarity: "common" | "rare" | "epic" | "legendary";
    };
  }

  ((achievements || []) as unknown as AchievementRow[]).forEach((row) => {
    const playerId = row.player_id;
    const playerName = row.players.name;
    const def = row.achievement_definitions;

    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, {
        player_id: playerId,
        player_name: playerName,
        achievements_count: 0,
        rarest_badge: {
          name: def.name,
          icon: def.icon,
          rarity: def.rarity,
        },
      });
    }

    const entry = playerMap.get(playerId)!;
    entry.achievements_count += 1;

    // Update rarest badge if this one is rarer
    if (
      rarityOrder[def.rarity as "common" | "rare" | "epic" | "legendary"] <
      rarityOrder[entry.rarest_badge.rarity]
    ) {
      entry.rarest_badge = {
        name: def.name,
        icon: def.icon,
        rarity: def.rarity,
      };
    }
  });

  const leaderboardData = Array.from(playerMap.values());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading level={2}>Logros</Heading>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sistema de gamificación y badges para los jugadores
          </p>
        </div>
        <BackButton href={`/g/${slug}/players`} label="Volver a jugadores" />
      </div>

      <AchievementsLeaderboard players={leaderboardData} />

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <Heading level={3}>Categorías de logros</Heading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏓</span>
              <h4 className="font-semibold text-[var(--ink)]">Partidos</h4>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Desbloquea logros jugando partidos: desde tu primer partido hasta ser una leyenda con 250 partidos.
            </p>
          </div>

          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <h4 className="font-semibold text-[var(--ink)]">Rachas</h4>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Acumula victorias consecutivas para desbloquear logros de racha, desde 3 hasta 15 victorias seguidas.
            </p>
          </div>

          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h4 className="font-semibold text-[var(--ink)]">ELO</h4>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Sube tu ELO para desbloquear logros de clasificación, desde 1100 hasta el nivel campeón de 1400.
            </p>
          </div>

          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <h4 className="font-semibold text-[var(--ink)]">Rankings</h4>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Alcanza el top 10, top 5, o el primer puesto del ranking para ganar logros exclusivos.
            </p>
          </div>

          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h4 className="font-semibold text-[var(--ink)]">Especiales</h4>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Logros especiales por logros únicos: sets perfectos, remontadas, y maratones.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
