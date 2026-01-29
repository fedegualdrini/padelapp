import { getPlayerStreaks } from "@/lib/streaks";

type StreakBadgeProps = {
  groupId: string;
  playerId: string;
  minStreak?: number;
};

export default async function StreakBadge({
  groupId,
  playerId,
  minStreak = 2,
}: StreakBadgeProps) {
  const streaks = await getPlayerStreaks(groupId, playerId);

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
