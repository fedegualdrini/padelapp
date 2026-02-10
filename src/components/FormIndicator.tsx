"use client";

import { useEffect, useState } from "react";
import { fetchPlayerRecentFormAction } from "@/lib/data-actions";
import type { PlayerForm } from "@/lib/data";

type FormIndicatorProps = {
  groupId: string;
  playerId: string;
};

export default function FormIndicator({
  groupId,
  playerId,
}: FormIndicatorProps) {
  const [form, setForm] = useState<PlayerForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadForm() {
      try {
        const data = await fetchPlayerRecentFormAction(groupId, playerId, 5);
        setForm(data);
      } catch (error) {
        console.error("Failed to load form:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadForm();
  }, [groupId, playerId]);

  if (isLoading || !form) {
    return null;
  }

  const getIndicatorStyle = () => {
    switch (form.formIndicator) {
      case "hot":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      case "cold":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const getIndicatorIcon = () => {
    // Use text presentation variation selectors to improve emoji consistency.
    // (Doesn't guarantee color emoji everywhere, but helps.)
    switch (form.formIndicator) {
      case "hot":
        return "🔥";
      case "cold":
        return "❄️";
      default:
        return "➡️";
    }
  };

  const getReasonText = () => {
    // If we don't have enough data, still show the indicator with an explanation.
    if (form.recentMatches < 3) {
      return `Not enough matches yet (need 3+). Last ${form.recentMatches}: ${form.wins}W-${form.losses}L.`;
    }

    const winRatePct = Math.round(form.winRate * 100);
    const eloSign = form.eloChange > 0 ? "+" : "";

    const streakText = form.streak
      ? ` Current streak: ${form.streak.count}${form.streak.type === "win" ? "W" : "L"}.`
      : "";

    return `Last ${form.recentMatches}: ${form.wins}W-${form.losses}L (${winRatePct}% win rate). ELO change: ${eloSign}${form.eloChange}.${streakText}`;
  };

  const tooltipId = `form-indicator-${playerId}`;

  return (
    <span className="group relative inline-flex">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getIndicatorStyle()}`}
        aria-describedby={tooltipId}
        tabIndex={0}
      >
        <span aria-hidden="true">{getIndicatorIcon()}</span>
      </span>

      {/* Tooltip */}
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max max-w-[280px] -translate-x-1/2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-2 text-xs text-[var(--ink)] shadow-lg opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {getReasonText()}
      </span>
    </span>
  );
}
