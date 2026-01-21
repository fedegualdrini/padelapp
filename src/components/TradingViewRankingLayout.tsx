"use client";

import { useState, useMemo, useCallback } from "react";
import { TradingViewChart } from "./TradingViewChart";
import { RankingSidebar } from "./RankingSidebar";
import type { FilterState } from "./FilterPanel";

type EloTimelinePoint = { date: string; rating: number };
type EloTimelineSeries = {
  playerId: string;
  name: string;
  status: string;
  points: EloTimelinePoint[];
};

interface TradingViewRankingLayoutProps {
  data: EloTimelineSeries[];
}

const USUAL_COLORS = [
  "#0d6b5f",
  "#15803d",
  "#0ea5a4",
  "#1f8a70",
  "#22c55e",
  "#14b8a6",
];

const INVITE_COLORS = [
  "#b45309",
  "#d97706",
  "#f59e0b",
  "#c2410c",
  "#ea580c",
  "#a16207",
];


export function TradingViewRankingLayout({
  data,
}: TradingViewRankingLayoutProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    eloRange: [0, 2000],
    activeOnly: false,
  });
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set());
  const [focusedPlayer, setFocusedPlayer] = useState<string | null>(null);

  // Assign colors to players
  const playerColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    const usualPlayers = data.filter((s) => s.status === "usual");
    const invitePlayers = data.filter((s) => s.status === "invite");

    usualPlayers.forEach((player, index) => {
      colorMap.set(player.playerId, USUAL_COLORS[index % USUAL_COLORS.length]);
    });

    invitePlayers.forEach((player, index) => {
      colorMap.set(
        player.playerId,
        INVITE_COLORS[index % INVITE_COLORS.length]
      );
    });

    return colorMap;
  }, [data]);

  // Add baseline point and extend to current date
  const timeFilteredData = useMemo(() => {
    // Find the earliest and latest dates across ALL players
    const allDates = data.flatMap(s => s.points.map(p => new Date(p.date)));
    const now = new Date();
    const maxDate = allDates.length > 0
      ? new Date(Math.max(now.getTime(), ...allDates.map(d => d.getTime())))
      : now;

    // Find the earliest match date and subtract 1 day for baseline
    const minDate = allDates.length > 0
      ? new Date(Math.min(...allDates.map(d => d.getTime())))
      : now;
    const baselineDate = new Date(minDate);
    baselineDate.setDate(baselineDate.getDate() - 1);

    return data.map((series) => {
      // Always start with baseline point at ELO 1000, then add all player points
      const points = [
        { date: baselineDate.toISOString(), rating: 1000 },
        ...series.points,
      ];

      // Add continuation to maxDate if the last point is before it
      if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        const lastDate = new Date(lastPoint.date);

        // If last point is before the max date, extend the line
        if (lastDate < maxDate) {
          points.push({ date: maxDate.toISOString(), rating: lastPoint.rating });
        }
      }

      return {
        ...series,
        points,
      };
    });
  }, [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = timeFilteredData;

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((series) => series.status === filters.status);
    }

    // ELO range filter
    filtered = filtered.filter((series) => {
      if (series.points.length === 0) return false;
      const currentElo = series.points[series.points.length - 1].rating;
      return (
        currentElo >= filters.eloRange[0] && currentElo <= filters.eloRange[1]
      );
    });

    // Active only filter
    if (filters.activeOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      filtered = filtered.filter((series) => {
        if (series.points.length === 0) return false;
        const lastMatch = new Date(series.points[series.points.length - 1].date);
        return lastMatch >= thirtyDaysAgo;
      });
    }

    // Remove players with no data points
    filtered = filtered.filter((series) => series.points.length > 0);

    return filtered;
  }, [timeFilteredData, filters]);

  // Debounced filter change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handlePlayerClick = useCallback((playerId: string | null) => {
    setFocusedPlayer(playerId);
  }, []);

  return (
    <div className="space-y-6">
      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart Section - 70% on desktop */}
        <div className="flex-1 lg:w-[70%]">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-glass)] p-4 backdrop-blur-sm">
            {filteredData.length > 0 ? (
              <TradingViewChart
                data={filteredData}
                hiddenPlayers={hiddenPlayers}
                focusedPlayer={focusedPlayer}
              />
            ) : (
              <div className="flex items-center justify-center h-[500px] text-[var(--muted)]">
                <div className="text-center">
                  <p className="text-sm font-medium">No data to display</p>
                  <p className="text-xs mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Section - 30% on desktop */}
        <div className="lg:w-[30%]">
          <RankingSidebar
            data={filteredData}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onPlayerClick={handlePlayerClick}
            focusedPlayer={focusedPlayer}
            playerColors={playerColors}
          />
        </div>
      </div>
    </div>
  );
}
