"use client";

import { useState } from "react";
import type { Racket, RacketStats } from "@/lib/racket-types";
import { formatDate } from "@/lib/utils";

type RacketCardProps = {
  racket: Racket;
  stats: RacketStats | null;
  onClick?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function RacketCard({
  racket,
  stats,
  onClick,
  showActions = false,
  onEdit,
  onDelete,
}: RacketCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (showDeleteConfirm && onDelete) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 shadow-sm transition-all hover:border-[color:var(--card-border-strong)] hover:shadow-md"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
            {racket.brand} {racket.model}
          </h3>
          {racket.weight && (
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {racket.weight}g {racket.balance && `• ${racket.balance}mm balance`}
            </p>
          )}
        </div>
        {showActions && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[color:var(--input-bg)] hover:text-[var(--ink)]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className={`rounded-lg p-1.5 transition ${
                  showDeleteConfirm
                    ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    : "text-[var(--muted)] hover:bg-[color:var(--input-bg)] hover:text-red-600"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && stats.matches_played > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[color:var(--input-bg)] p-2.5">
            <p className="text-xs font-semibold text-[var(--muted)]">Win Rate</p>
            <p className="mt-1 font-display text-lg font-bold text-[var(--ink)]">
              {stats.win_rate}%
            </p>
            <p className="text-xs text-[var(--muted)]">
              {stats.matches_won}/{stats.matches_played}
            </p>
          </div>
          <div className="rounded-xl bg-[color:var(--input-bg)] p-2.5">
            <p className="text-xs font-semibold text-[var(--muted)]">ELO Change</p>
            <p
              className={`mt-1 font-display text-lg font-bold ${
                stats.elo_change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.elo_change >= 0 ? "+" : ""}
              {stats.elo_change}
            </p>
            <p className="text-xs text-[var(--muted)]">Avg: {stats.avg_elo}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-[color:var(--input-bg)] p-3 text-center">
          <p className="text-sm text-[var(--muted)]">No matches played yet</p>
        </div>
      )}

      {/* Footer */}
      {stats?.last_used && (
        <p className="mt-3 text-xs text-[var(--muted)]">
          Last used: {formatDate(stats.last_used)}
        </p>
      )}
    </div>
  );
}
