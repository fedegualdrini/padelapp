'use client';

import { useEffect, useState, memo } from 'react';
import AchievementsRow from './AchievementsRow';
import { getPlayerAchievements } from '@/lib/supabase/achievements';

type Achievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

type PlayerAchievementsRowProps = {
  groupId: string;
  playerId: string;
};

// Simple skeleton loader for achievements
function AchievementSkeleton() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-5 w-5 animate-pulse rounded-full bg-[color:var(--card-border)]" />
      <div className="h-5 w-5 animate-pulse rounded-full bg-[color:var(--card-border)]" />
    </div>
  );
}

function PlayerAchievementsRowComponent({ groupId, playerId }: PlayerAchievementsRowProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    // Use a small delay to batch requests
    const timeoutId = setTimeout(() => {
      loadAchievements();
    }, 50);

    async function loadAchievements() {
      try {
        const data = await getPlayerAchievements(groupId, playerId);
        if (!cancelled) {
          setAchievements(data.unlocked);
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [groupId, playerId]);

  if (loading) {
    return <AchievementSkeleton />;
  }

  if (achievements.length === 0) {
    return null;
  }

  return <AchievementsRow achievements={achievements} max={3} size="sm" />;
}

// Memoize to prevent unnecessary re-renders
export default memo(PlayerAchievementsRowComponent, (prev, next) => {
  return prev.groupId === next.groupId && prev.playerId === next.playerId;
});
