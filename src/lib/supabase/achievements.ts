import { supabase } from './client';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementDefinition = {
  key: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  category: string;
  icon: string;
  achievement_order: number;
  criteria: Record<string, number | string>;
};

export type Achievement = {
  id: string;
  player_id: string;
  achievement_key: string;
  unlocked_at: string;
};

export type AchievementWithDetails = Achievement & AchievementDefinition;

export type AchievementProgress = {
  current: number | null;
  target: number | null;
  progress_percent: number;
};

export type AchievementWithProgress = AchievementDefinition & {
  progress: AchievementProgress;
  progress_percent: number;
};

export type PlayerAchievements = {
  unlocked: AchievementWithDetails[];
  locked: AchievementWithProgress[];
};

/**
 * Get all achievements for a player (unlocked + locked with progress)
 */
export async function getPlayerAchievements(
  groupId: string,
  playerId: string
): Promise<PlayerAchievements> {
  const { data, error } = await supabase.rpc('get_player_achievements', {
    p_group_id: groupId,
    p_player_id: playerId,
  });

  if (error) {
    console.error('Error fetching player achievements:', error);
    return { unlocked: [], locked: [] };
  }

  return {
    unlocked: data.unlocked || [],
    locked: data.locked || [],
  };
}

/**
 * Check achievements for a player and unlock newly completed ones
 */
export async function checkAchievements(
  groupId: string,
  playerId: string
): Promise<{ new_unlocks: string[]; total_new: number }> {
  // Check standard achievements
  const { data: standardData, error: standardError } = await supabase.rpc(
    'check_achievements',
    {
      p_group_id: groupId,
      p_player_id: playerId,
    }
  );

  if (standardError) {
    console.error('Error checking standard achievements:', standardError);
    return { new_unlocks: [], total_new: 0 };
  }

  // Check special achievements
  const { data: specialData, error: specialError } = await supabase.rpc(
    'check_special_achievements',
    {
      p_group_id: groupId,
      p_player_id: playerId,
    }
  );

  if (specialError) {
    console.error('Error checking special achievements:', specialError);
  }

  const newUnlocks = [
    ...(standardData.new_unlocks || []),
    ...(specialData?.new_unlocks || []),
  ];

  const newTotal = (standardData.total_new || 0) + (specialData?.total_new || 0);

  return {
    new_unlocks: newUnlocks,
    total_new: newTotal,
  };
}

/**
 * Check achievements for all players in a group
 */
export async function checkGroupAchievements(groupId: string) {
  const { data: players, error } = await supabase
    .from('players')
    .select('id')
    .eq('group_id', groupId);

  if (error) {
    console.error('Error fetching players for achievement check:', error);
    return;
  }

  const results = await Promise.all(
    players.map((player) => checkAchievements(groupId, player.id))
  );

  return results;
}

/**
 * Get achievement definition by key
 */
export async function getAchievementDefinition(
  key: string
): Promise<AchievementDefinition | null> {
  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    console.error('Error fetching achievement definition:', error);
    return null;
  }

  return data;
}

/**
 * Get all achievement definitions
 */
export async function getAllAchievementDefinitions(): Promise<
  AchievementDefinition[]
> {
  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .order('achievement_order');

  if (error) {
    console.error('Error fetching achievement definitions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get achievement leaderboard for a group
 */
export async function getAchievementLeaderboard(
  groupId: string
): Promise<
  Array<{
    player_id: string;
    player_name: string;
    achievements_count: number;
    rarest_badge: {
      name: string;
      icon: string;
      rarity: AchievementRarity;
    };
  }>
> {
  const { data, error } = await supabase
    .from('achievements')
    .select(`
      player_id,
      achievement_key,
      unlocked_at,
      players!inner (id, name),
      achievement_definitions!inner (key, name, icon, rarity)
    `)
    .eq('players.group_id', groupId);

  if (error) {
    console.error('Error fetching achievement leaderboard:', error);
    return [];
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
        rarity: AchievementRarity;
      };
    }
  >();

  const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };

  interface AchievementRow {
    player_id: string;
    achievement_key: string;
    unlocked_at: string;
    players: { name: string };
    achievement_definitions: AchievementDefinition;
  }

  ((data || []) as unknown as AchievementRow[]).forEach((row) => {
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
      rarityOrder[def.rarity as AchievementRarity] <
      rarityOrder[entry.rarest_badge.rarity]
    ) {
      entry.rarest_badge = {
        name: def.name,
        icon: def.icon,
        rarity: def.rarity,
      };
    }
  });

  return Array.from(playerMap.values());
}

/**
 * Get recently unlocked achievements for a player
 */
export async function getRecentAchievements(
  playerId: string,
  limit = 10
): Promise<AchievementWithDetails[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select(`
      *,
      achievement_definitions!inner (*)
    `)
    .eq('player_id', playerId)
    .order('unlocked_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent achievements:', error);
    return [];
  }

  interface RecentAchievementRow {
    id: string;
    player_id: string;
    achievement_key: string;
    unlocked_at: string;
    achievement_definitions: AchievementDefinition;
  }

  return ((data || []) as unknown as RecentAchievementRow[]).map((row) => ({
    id: row.id,
    player_id: row.player_id,
    achievement_key: row.achievement_key,
    unlocked_at: row.unlocked_at,
    ...row.achievement_definitions,
  }));
}
