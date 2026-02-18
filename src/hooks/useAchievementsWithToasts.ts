"use client";

import { useToast } from "@/components/ui/toast";
import { checkAchievements, getAchievementDefinition } from "@/lib/supabase/achievements";

/**
 * Hook to check achievements and automatically show toast notifications
 * for newly unlocked achievements
 */
export function useAchievementsWithToasts() {
  const { showAchievement } = useToast();

  /**
   * Check achievements for a player and show toasts for new unlocks
   */
  const checkAndNotify = async (groupId: string, playerId: string) => {
    try {
      const result = await checkAchievements(groupId, playerId);

      if (result.total_new > 0 && result.new_unlocks.length > 0) {
        // Show toast for each newly unlocked achievement
        for (const achievementKey of result.new_unlocks) {
          const definition = await getAchievementDefinition(achievementKey);
          if (definition) {
            showAchievement({
              name: definition.name,
              description: definition.description,
              icon: definition.icon,
              rarity: definition.rarity,
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error checking achievements with toasts:', error);
      return { new_unlocks: [], total_new: 0 };
    }
  };

  return { checkAndNotify };
}
