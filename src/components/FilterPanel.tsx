"use client";

import { useState } from "react";

export type FilterState = {
  status: "all" | "usual" | "invite";
  eloRange: [number, number];
  activeOnly: boolean;
};

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  minElo: number;
  maxElo: number;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  minElo,
  maxElo,
}: FilterPanelProps) {
  // Keep local state only for smooth slider dragging.
  // We update the parent state on mouse/touch end.
  const [localEloRange, setLocalEloRange] = useState<[number, number]>(
    filters.eloRange
  );

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.eloRange[0] !== minElo ||
    filters.eloRange[1] !== maxElo ||
    filters.activeOnly;

  const handleStatusChange = (status: "all" | "usual" | "invite") => {
    onFiltersChange({ ...filters, status });
  };

  const handleEloRangeChange = (index: 0 | 1, value: number) => {
    const newRange: [number, number] = [...localEloRange] as [number, number];
    newRange[index] = value;

    // Ensure min <= max
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[1] = newRange[0];
    } else if (index === 1 && newRange[1] < newRange[0]) {
      newRange[0] = newRange[1];
    }

    setLocalEloRange(newRange);
  };

  const handleEloRangeCommit = () => {
    onFiltersChange({ ...filters, eloRange: localEloRange });
  };

  const handleActiveToggle = () => {
    onFiltersChange({ ...filters, activeOnly: !filters.activeOnly });
  };

  const handleReset = () => {
    const resetRange: [number, number] = [minElo, maxElo];
    setLocalEloRange(resetRange);
    onFiltersChange({
      status: "all",
      eloRange: resetRange,
      activeOnly: false,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-[var(--card-border)] bg-[var(--card-glass)] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--muted)]">
          Player Status
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange("all")}
            aria-pressed={filters.status === "all"}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.status === "all"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--card-solid)] text-[var(--ink)] hover:bg-[var(--card-border)]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusChange("usual")}
            aria-pressed={filters.status === "usual"}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.status === "usual"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--card-solid)] text-[var(--ink)] hover:bg-[var(--card-border)]"
            }`}
          >
            Usual
          </button>
          <button
            onClick={() => handleStatusChange("invite")}
            aria-pressed={filters.status === "invite"}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.status === "invite"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--card-solid)] text-[var(--ink)] hover:bg-[var(--card-border)]"
            }`}
          >
            Invite
          </button>
        </div>
      </div>

      {/* ELO Range Slider */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--muted)]">ELO Range</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={minElo}
              max={maxElo}
              value={localEloRange[0]}
              onChange={(e) => handleEloRangeChange(0, Number(e.target.value))}
              onMouseUp={handleEloRangeCommit}
              onTouchEnd={handleEloRangeCommit}
              aria-label="Minimum ELO"
              className="flex-1"
            />
            <span className="text-xs font-mono w-12 text-right tabular-nums">
              {localEloRange[0]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={minElo}
              max={maxElo}
              value={localEloRange[1]}
              onChange={(e) => handleEloRangeChange(1, Number(e.target.value))}
              onMouseUp={handleEloRangeCommit}
              onTouchEnd={handleEloRangeCommit}
              aria-label="Maximum ELO"
              className="flex-1"
            />
            <span className="text-xs font-mono w-12 text-right tabular-nums">
              {localEloRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* Active Players Toggle */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="active-toggle"
          className="text-xs font-medium text-[var(--muted)]"
        >
          Active players only
        </label>
        <input
          id="active-toggle"
          type="checkbox"
          checked={filters.activeOnly}
          onChange={handleActiveToggle}
          className="h-4 w-4 rounded border-[var(--card-border)] bg-[var(--card-solid)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0"
        />
      </div>
    </div>
  );
}
