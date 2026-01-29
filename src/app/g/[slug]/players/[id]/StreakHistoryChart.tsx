"use client";

import { useMemo } from "react";

type StreakHistoryItem = {
  streak: number;
  type: "win" | "loss";
  startMatchId: string;
  endMatchId: string;
  startDate: string;
  endDate: string;
};

type StreakHistoryChartProps = {
  streakHistory: StreakHistoryItem[];
};

export default function StreakHistoryChart({ streakHistory }: StreakHistoryChartProps) {
  // Sort by start date (newest first)
  const sortedHistory = useMemo(() => {
    return [...streakHistory].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [streakHistory]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
    });
  };

  const maxStreak = useMemo(() => {
    return Math.max(...sortedHistory.map((h) => h.streak), 1);
  }, [sortedHistory]);

  return (
    <div className="space-y-3">
      {sortedHistory.map((streak, index) => {
        const widthPercent = (streak.streak / maxStreak) * 100;
        const isWin = streak.type === "win";

        return (
          <div key={`${streak.startMatchId}-${index}`} className="flex items-center gap-3">
            {/* Icon */}
            <span className="flex-shrink-0 text-lg">{isWin ? "🔥" : "❄️"}</span>

            {/* Bar */}
            <div className="flex-1">
              <div
                className={`h-8 rounded-lg flex items-center px-3 transition-all ${
                  isWin
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-gradient-to-r from-blue-400 to-blue-600"
                }`}
                style={{ width: `${Math.max(widthPercent, 15)}%` }}
              >
                <span className="text-white font-semibold text-sm whitespace-nowrap">
                  {streak.streak} {isWin ? "victorias" : "derrotas"}
                </span>
              </div>
            </div>

            {/* Date range */}
            <div className="flex-shrink-0 text-xs text-[var(--muted)] text-right min-w-[100px]">
              <div>{formatDate(streak.startDate)}</div>
              <div>→ {formatDate(streak.endDate)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
