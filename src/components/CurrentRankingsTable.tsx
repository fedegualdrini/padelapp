"use client";

import { useMemo, useState } from "react";

type SortKey = "rank" | "name" | "elo" | "matches";

type SortIconProps = {
  column: SortKey;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
};

function SortIcon({ column, sortKey, sortDirection }: SortIconProps) {
  if (sortKey !== column) {
    return <span className="ml-1 text-[var(--muted)] opacity-50">↕</span>;
  }

  return (
    <span className="ml-1 text-[var(--accent)]">
      {sortDirection === "asc" ? "↑" : "↓"}
    </span>
  );
}

export type RankingPlayer = {
  playerId: string;
  name: string;
  currentElo: number;
  change: number;
  matchesPlayed: number;
  color: string;
};

interface CurrentRankingsTableProps {
  players: RankingPlayer[];
  onPlayerHover?: (playerId: string | null) => void;
  onPlayerClick?: (playerId: string | null) => void;
  focusedPlayer?: string | null;
}

export function CurrentRankingsTable({
  players,
  onPlayerHover,
  onPlayerClick,
  focusedPlayer,
}: CurrentRankingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("elo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedPlayers = useMemo(() => {
    const sorted = [...players].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case "rank":
        case "elo":
          comparison = b.currentElo - a.currentElo;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "matches":
          comparison = b.matchesPlayed - a.matchesPlayed;
          break;
      }

      return sortDirection === "asc" ? -comparison : comparison;
    });

    return sorted;
  }, [players, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  };

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-glass)] backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--card-border)]">
        <h3 className="text-sm font-semibold">Rankings</h3>
      </div>

      <div className="overflow-y-auto max-h-[600px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[var(--card-solid)] border-b border-[var(--card-border)]">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">
                <button
                  onClick={() => handleSort("elo")}
                  className="flex items-center hover:text-[var(--ink)] transition-colors"
                >
                  #
                  <SortIcon
                    column="elo"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </button>
              </th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted)]">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-[var(--ink)] transition-colors"
                >
                  Player
                  <SortIcon
                    column="name"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </button>
              </th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted)]">
                <button
                  onClick={() => handleSort("elo")}
                  className="flex items-center justify-end hover:text-[var(--ink)] transition-colors ml-auto"
                >
                  ELO
                  <SortIcon
                    column="elo"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                </button>
              </th>
              <th className="px-3 py-2 text-center font-medium text-[var(--muted)]">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => {
              const isFocused = focusedPlayer === player.playerId;
              const isDimmed = focusedPlayer && !isFocused;

              return (
                <tr
                  key={player.playerId}
                  onMouseEnter={() => onPlayerHover?.(player.playerId)}
                  onMouseLeave={() => onPlayerHover?.(null)}
                  onClick={() =>
                    onPlayerClick?.(isFocused ? null : player.playerId)
                  }
                  className={`border-b border-[var(--card-border)] cursor-pointer transition-all ${
                    isFocused
                      ? "bg-[var(--accent)]/10"
                      : "hover:bg-[var(--card-border)] hover:bg-opacity-50"
                  } ${isDimmed ? "opacity-40" : ""}`}
                >
                  <td className="px-3 py-2 text-[var(--muted)] font-mono tabular-nums">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-medium truncate">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                    {player.currentElo}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {player.change !== 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                          player.change > 0
                            ? "text-[var(--chart-positive)]"
                            : "text-[var(--chart-negative)]"
                        }`}
                      >
                        {player.change > 0 ? "↑" : "↓"}
                        {Math.abs(player.change)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedPlayers.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            No players found
          </div>
        )}
      </div>
    </div>
  );
}
