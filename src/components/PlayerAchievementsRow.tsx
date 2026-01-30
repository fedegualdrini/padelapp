"use client";

import { useEffect, useState } from 'react';
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

export default function PlayerAchievementsRow({
  groupId,
  playerId,
}: PlayerAchievementsRowProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const data = await getPlayerAchievements(groupId, playerId);
        setAchievements(data.unlocked);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAchievements();
  }, [groupId, playerId]);

  if (loading) {
    return null;
  }

  if (achievements.length === 0) {
    return null;
  }

  return <AchievementsRow achievements={achievements} max={3} size="sm" />;
}
