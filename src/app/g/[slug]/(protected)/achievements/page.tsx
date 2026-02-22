import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroupBySlug } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AchievementsLeaderboard from "@/components/AchievementsLeaderboard";
import AchievementBadge from "@/components/AchievementBadge";

type AchievementsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: AchievementsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  return {
    title: group ? `Achievements — ${group.name}` : "Achievements",
    description: group
      ? `Unlock achievements and earn badges in ${group.name}. Track your milestones and accomplishments.`
      : "Unlock achievements and earn badges.",
  };
}

type AchievementDefinition = {
  key: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
  icon: string;
  achievement_order: number;
  criteria: Record<string, unknown>;
};

type AchievementStats = {
  total: number;
  byRarity: Record<string, number>;
  byCategory: Record<string, number>;
};

const categoryInfo: Record<string, { label: string; icon: string; description: string }> = {
  matches: {
    label: "Partidos",
    icon: "🏓",
    description: "Desbloquea logros jugando partidos: desde tu primer partido hasta ser una leyenda con 250 partidos.",
  },
  streaks: {
    label: "Rachas",
    icon: "🔥",
    description: "Acumula victorias consecutivas para desbloquear logros de racha, desde 3 hasta 15 victorias seguidas.",
  },
  elo: {
    label: "ELO",
    icon: "📊",
    description: "Sube tu ELO para desbloquear logros de clasificación, desde 1100 hasta el nivel campeón de 1400.",
  },
  rankings: {
    label: "Rankings",
    icon: "🏆",
    description: "Alcanza el top 10, top 5, o el primer puesto del ranking para ganar logros exclusivos.",
  },
  special: {
    label: "Especiales",
    icon: "✨",
    description: "Logros especiales por logros únicos: sets perfectos, remontadas, y maratones.",
  },
};

const rarityColors = {
  common: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-300 dark:border-gray-600" },
  rare: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-300 dark:border-blue-600" },
  epic: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-300 dark:border-purple-600" },
  legendary: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-300 dark:border-yellow-600" },
};

export default async function AchievementsPage({ params }: AchievementsPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  // Fetch achievement definitions
  const { data: achievementDefinitions, error: defError } = await supabase
    .from("achievement_definitions")
    .select("*")
    .order("achievement_order");

  if (defError) {
    console.error("Error fetching achievement definitions:", defError);
  }

  // Fetch unlocked achievements for leaderboard
  const { data: achievements, error: achError } = await supabase
    .from("achievements")
    .select(`
      player_id,
      achievement_key,
      unlocked_at,
      players!inner (id, name),
      achievement_definitions!inner (key, name, icon, rarity)
    `)
    .eq("players.group_id", group.id);

  if (achError) {
    console.error("Error fetching achievements:", achError);
  }

  // Aggregate by player for leaderboard
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

  // Count unlocks per achievement
  const unlockCounts = new Map<string, number>();
  ((achievements || []) as unknown as AchievementRow[]).forEach((row) => {
    unlockCounts.set(row.achievement_key, (unlockCounts.get(row.achievement_key) || 0) + 1);
  });

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
  const definitions = (achievementDefinitions || []) as unknown as AchievementDefinition[];

  // Calculate stats
  const stats: AchievementStats = {
    total: definitions.length,
    byRarity: {},
    byCategory: {},
  };

  definitions.forEach((def) => {
    stats.byRarity[def.rarity] = (stats.byRarity[def.rarity] || 0) + 1;
    stats.byCategory[def.category] = (stats.byCategory[def.category] || 0) + 1;
  });

  // Group definitions by category
  const achievementsByCategory = definitions.reduce((acc, def) => {
    if (!acc[def.category]) {
      acc[def.category] = [];
    }
    acc[def.category].push(def);
    return acc;
  }, {} as Record<string, AchievementDefinition[]>);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-[var(--ink)]">Logros</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sistema de gamificación y badges para los jugadores
          </p>
        </div>
        <Link
          href={`/g/${slug}/players`}
          className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
        >
          ← Volver a jugadores
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 text-center">
          <p className="text-3xl font-bold text-[var(--ink)]">{stats.total}</p>
          <p className="text-sm text-[var(--muted)]">Logros disponibles</p>
        </div>
        <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 text-center">
          <p className="text-3xl font-bold text-[var(--ink)]">{leaderboardData.length}</p>
          <p className="text-sm text-[var(--muted)]">Jugadores con logros</p>
        </div>
        <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 text-center">
          <p className="text-3xl font-bold text-yellow-500">{stats.byRarity.legendary || 0}</p>
          <p className="text-sm text-[var(--muted)]">Legendarios</p>
        </div>
        <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 text-center">
          <p className="text-3xl font-bold text-purple-500">{stats.byRarity.epic || 0}</p>
          <p className="text-sm text-[var(--muted)]">Épicos</p>
        </div>
      </div>

      {/* Leaderboard */}
      <AchievementsLeaderboard players={leaderboardData} groupSlug={slug} />

      {/* All Available Achievements */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mb-6">
          <h3 className="font-display text-xl text-[var(--ink)]">Todos los Logros</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {stats.total} logros disponibles para desbloquear
          </p>
        </div>

        {definitions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--muted)]">No hay logros configurados.</p>
            <p className="text-sm text-[var(--muted)] mt-2">
              Los administradores pueden agregar logros desde el panel de configuración.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => {
              const info = categoryInfo[category] || { label: category, icon: "🎯", description: "" };
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{info.icon}</span>
                    <h4 className="font-display text-lg text-[var(--ink)]">{info.label}</h4>
                    <span className="ml-2 rounded-full bg-[color:var(--card-solid)] px-2 py-0.5 text-xs text-[var(--muted)]">
                      {categoryAchievements.length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryAchievements.map((achievement) => {
                      const unlockCount = unlockCounts.get(achievement.key) || 0;
                      const colors = rarityColors[achievement.rarity];
                      return (
                        <div
                          key={achievement.key}
                          className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:scale-[1.02] hover:shadow-md`}
                        >
                          <div className="flex items-start gap-3">
                            <AchievementBadge
                              name={achievement.name}
                              icon={achievement.icon}
                              rarity={achievement.rarity}
                              size="lg"
                              showTooltip={false}
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className={`font-semibold ${colors.text} truncate`}>
                                {achievement.name}
                              </h5>
                              <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
                                {achievement.description}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-medium uppercase tracking-wider opacity-75">
                                  {achievement.rarity}
                                </span>
                                <span className="text-xs text-[var(--muted)]">
                                  • {unlockCount} {unlockCount === 1 ? "desbloqueado" : "desbloqueados"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How to unlock section */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">¿Cómo desbloquear logros?</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(categoryInfo).map(([key, info]) => (
            <div
              key={key}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{info.icon}</span>
                <h4 className="font-semibold text-[var(--ink)]">{info.label}</h4>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{info.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
