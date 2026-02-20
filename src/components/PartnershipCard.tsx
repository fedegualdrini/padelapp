"use client";

import { memo, useState } from "react";
import Link from "next/link";
import type { Partnership } from "@/lib/partnership-types";
import {
  getPartnershipTier,
  getMatchesBadge,
  getEloDeltaIndicator,
  calculateSynergyScore,
} from "@/lib/partnership-types";

interface PartnershipCardProps {
  partnership: Partnership;
  groupSlug: string;
  compact?: boolean;
  showSynergyScore?: boolean;
}

// FIX: Wrap with React.memo - this component is rendered in lists
// and has expensive calculations (synergyScore). Memo prevents re-render
// when parent list changes but this card's props don't.
function PartnershipCard({
  partnership,
  groupSlug,
  compact = false,
  showSynergyScore = true,
}: PartnershipCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    player1_id,
    player2_id,
    player1_name,
    player2_name,
    matches_played,
    wins,
    losses,
    win_rate,
    elo_change_delta,
    last_played_together,
  } = partnership;

  const winRatePercent = Math.round(win_rate * 100);
  const tier = getPartnershipTier(win_rate);
  const matchesBadge = getMatchesBadge(matches_played);
  const eloIndicator = getEloDeltaIndicator(elo_change_delta);
  const synergyScore = showSynergyScore ? calculateSynergyScore(partnership) : null;

  // Color coding for win rate
  const tierColors = {
    excellent: "bg-green-500/10 text-green-600 border-green-500/20",
    good: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    fair: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    poor: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const eloIndicatorEmoji = {
    positive: "📈",
    negative: "📉",
    neutral: "➖",
  };

  const eloIndicatorText = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  };

  // Format date
  const lastPlayedDate = last_played_together
    ? new Date(last_played_together).toLocaleDateString("es-AR", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Desconocido";

  // Construct detail URL
  const detailUrl = `/g/${groupSlug}/partnerships/${player1_id}/${player2_id}`;

  if (compact) {
    return (
      <Link
        href={detailUrl}
        className={`
          block p-3 rounded-lg border border-gray-200 dark:border-gray-700
          hover:border-blue-500/50 hover:shadow-sm
          transition-all duration-200
          ${isHovered ? "scale-[1.02]" : ""}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {player1_name?.charAt(0) || "?"}
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
                {player2_name?.charAt(0) || "?"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {player1_name} & {player2_name}
              </p>
              <p className="text-xs text-gray-500">
                {matches_played} partidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${eloIndicatorText[eloIndicator]}`}>
              {winRatePercent}%
            </span>
            {synergyScore !== null && (
              <span className="text-xs text-gray-400">
                {synergyScore.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={detailUrl}
      className={`
        block p-4 rounded-xl border-2
        ${tierColors[tier]}
        hover:shadow-lg hover:scale-[1.02]
        transition-all duration-300
        bg-white dark:bg-gray-900
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header: Player names and avatars */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex -space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md border-2 border-white dark:border-gray-800">
            {player1_name?.charAt(0) || "?"}
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-md border-2 border-white dark:border-gray-800">
            {player2_name?.charAt(0) || "?"}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
            {player1_name} & {player2_name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${tierColors[tier]}`}>
              {matchesBadge}
            </span>
            <span className="text-xs text-gray-500">
              Último partido: {lastPlayedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {winRatePercent}%
          </p>
          <p className="text-xs text-gray-500">% victorias</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {wins}-{losses}
          </p>
          <p className="text-xs text-gray-500">V-D</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className={`text-2xl font-bold ${eloIndicatorText[eloIndicator]}`}>
            {eloIndicatorEmoji[eloIndicator]}
          </p>
          <p className="text-xs text-gray-500">Delta ELO</p>
        </div>
      </div>

      {/* Synergy score bar */}
      {showSynergyScore && synergyScore !== null && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Puntaje de sinergia
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {synergyScore.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, synergyScore * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Action hint */}
      <div className="mt-3 text-center">
        <span className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          Clic para ver detalles →
        </span>
      </div>
    </Link>
  );
}

// Export memoized version for list rendering performance
export default memo(PartnershipCard);
