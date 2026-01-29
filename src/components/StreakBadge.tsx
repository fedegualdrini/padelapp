"use client";

import { useEffect, useState } from "react";
import { fetchPlayerStreaksAction } from "@/lib/streaks-actions";
import type { PlayerStreaks } from "@/lib/streaks";

type StreakBadgeProps = {
  groupId: string;
  playerId: string;
  minStreak?: number;
};

export default function StreakBadge({
  groupId,
  playerId,
  minStreak = 2,
}: StreakBadgeProps) {
  const [streaks, setStreaks] = useState<PlayerStreaks | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStreaks() {
      try {
        const data = await fetchPlayerStreaksAction(groupId, playerId);
        setStreaks(data);
      } catch (error) {
        console.error("Failed to load streaks:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStreaks();
  }, [groupId, playerId]);

  if (isLoading || !streaks) {
    return null;
  }

  // Only show badge if streak meets minimum threshold
  if (Math.abs(streaks.currentStreak) < minStreak) {
    return null;
  }

  const isWinStreak = streaks.currentStreak > 0;
  const streakCount = Math.abs(streaks.currentStreak);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isWinStreak
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      }`}
      title={isWinStreak ? `${streakCount} victorias consecutivas` : `${streakCount} derrotas consecutivas`}
    >
      <span>{isWinStreak ? "🔥" : "❄️"}</span>
      <span>{streakCount}{isWinStreak ? "W" : "L"}</span>
    </span>
  );
}
