"use client";

import { FilterPanel, type FilterState } from "./FilterPanel";
import { CurrentRankingsTable, type RankingPlayer } from "./CurrentRankingsTable";

type EloTimelinePoint = { date: string; rating: number };
type EloTimelineSeries = {
  playerId: string;
  name: string;
  status: string;
  points: EloTimelinePoint[];
};

interface RankingSidebarProps {
  data: EloTimelineSeries[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onPlayerHover?: (playerId: string | null) => void;
  onPlayerClick?: (playerId: string | null) => void;
  focusedPlayer?: string | null;
  playerColors: Map<string, string>;
}

export function RankingSidebar({
  data,
  filters,
  onFiltersChange,
  onPlayerHover,
  onPlayerClick,
  focusedPlayer,
  playerColors,
}: RankingSidebarProps) {
  // Calculate current rankings from timeline data
  const rankings: RankingPlayer[] = data
    .map((series) => {
      const points = series.points;
      if (points.length === 0) {
        return null;
      }

      const currentElo = Math.round(points[points.length - 1].rating);
      const previousElo =
        points.length > 1 ? Math.round(points[points.length - 2].rating) : currentElo;
      const change = currentElo - previousElo;

      return {
        playerId: series.playerId,
        name: series.name,
        currentElo,
        change,
        matchesPlayed: points.length,
        color: playerColors.get(series.playerId) || "#888888",
      };
    })
    .filter((player): player is RankingPlayer => player !== null);

  // Calculate min/max ELO for filter panel
  const eloValues = rankings.map((p) => p.currentElo);
  const minElo = Math.floor(Math.min(...eloValues, 800) / 50) * 50;
  const maxElo = Math.ceil(Math.max(...eloValues, 1200) / 50) * 50;

  return (
    <div className="space-y-4">
      <FilterPanel
        filters={filters}
        onFiltersChange={onFiltersChange}
        minElo={minElo}
        maxElo={maxElo}
      />

      <CurrentRankingsTable
        players={rankings}
        onPlayerHover={onPlayerHover}
        onPlayerClick={onPlayerClick}
        focusedPlayer={focusedPlayer}
      />
    </div>
  );
}
