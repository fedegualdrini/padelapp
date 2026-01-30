"use client";

import { useEffect, useState } from "react";
import type { Racket, RacketComparison } from "@/lib/racket-types";

type RacketComparisonModalProps = {
  rackets: Racket[];
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onCompare: (racketIds: string[]) => Promise<RacketComparison[]>;
};

export default function RacketComparisonModal({
  rackets,
  groupId,
  isOpen,
  onClose,
  onCompare,
}: RacketComparisonModalProps) {
  const [selectedRacketIds, setSelectedRacketIds] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<RacketComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedRacketIds([]);
      setComparisons([]);
    }
  }, [isOpen]);

  const toggleRacket = (racketId: string) => {
    setSelectedRacketIds((prev) => {
      if (prev.includes(racketId)) {
        return prev.filter((id) => id !== racketId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, racketId];
    });
  };

  const handleCompare = async () => {
    if (selectedRacketIds.length < 2) {
      return;
    }

    setIsLoading(true);
    try {
      const results = await onCompare(selectedRacketIds);
      setComparisons(results);
    } catch (error) {
      console.error("Error comparing rackets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedRackets = rackets.filter((r) => selectedRacketIds.includes(r.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-6 shadow-xl">
        <div className="mb-6">
          <h3 className="font-display text-xl text-[var(--ink)]">
            Compare Rackets
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Select 2-4 rackets to compare side-by-side
          </p>
        </div>

        {/* Racket Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">
            Select Rackets ({selectedRacketIds.length}/4)
          </label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {rackets.map((racket) => (
              <button
                key={racket.id}
                type="button"
                onClick={() => toggleRacket(racket.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  selectedRacketIds.includes(racket.id)
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10"
                    : "border-[color:var(--card-border)] bg-[color:var(--input-bg)] hover:border-[color:var(--card-border-strong)]"
                }`}
              >
                <p className="font-semibold text-[var(--ink)]">
                  {racket.brand} {racket.model}
                </p>
                {racket.weight && (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {racket.weight}g
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Results */}
        {comparisons.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[color:var(--card-border)]">
                  <th className="px-3 py-2 text-left text-sm font-semibold text-[var(--ink)]">
                    Metric
                  </th>
                  {selectedRackets.map((racket) => (
                    <th
                      key={racket.id}
                      className="px-3 py-2 text-center text-sm font-semibold text-[var(--ink)]"
                    >
                      {racket.brand}
                      <br />
                      <span className="text-xs text-[var(--muted)]">
                        {racket.model}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[color:var(--card-border)]">
                  <td className="px-3 py-2 text-sm text-[var(--ink)]">
                    Matches Played
                  </td>
                  {comparisons.map((comp) => (
                    <td
                      key={comp.racket_id}
                      className="px-3 py-2 text-center text-sm text-[var(--ink)]"
                    >
                      {comp.matches_played}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[color:var(--card-border)]">
                  <td className="px-3 py-2 text-sm text-[var(--ink)]">
                    Win Rate
                  </td>
                  {comparisons.map((comp) => (
                    <td
                      key={comp.racket_id}
                      className="px-3 py-2 text-center text-sm text-[var(--ink)]"
                    >
                      {comp.matches_played > 0 ? (
                        <>
                          {comp.win_rate}%
                          <div className="mt-1 h-2 rounded-full bg-[color:var(--input-bg)]">
                            <div
                              className="h-full rounded-full bg-[color:var(--accent)]"
                              style={{ width: `${comp.win_rate}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-[var(--muted)]">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[color:var(--card-border)]">
                  <td className="px-3 py-2 text-sm text-[var(--ink)]">
                    ELO Change
                  </td>
                  {comparisons.map((comp) => (
                    <td
                      key={comp.racket_id}
                      className={`px-3 py-2 text-center text-sm ${
                        comp.elo_change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {comp.elo_change >= 0 ? "+" : ""}
                      {comp.elo_change}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[color:var(--card-border)]">
                  <td className="px-3 py-2 text-sm text-[var(--ink)]">
                    Avg ELO
                  </td>
                  {comparisons.map((comp) => (
                    <td
                      key={comp.racket_id}
                      className="px-3 py-2 text-center text-sm text-[var(--ink)]"
                    >
                      {comp.avg_elo}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[color:var(--card-border)]">
                  <td className="px-3 py-2 text-sm text-[var(--ink)]">
                    Best ELO Gain
                  </td>
                  {comparisons.map((comp) => (
                    <td
                      key={comp.racket_id}
                      className="px-3 py-2 text-center text-sm text-green-600"
                    >
                      +{comp.best_elo_gain}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[color:var(--card-border)]">
                  <td className="px-3 py-2 text-sm text-[var(--ink)]">
                    Worst ELO Drop
                  </td>
                  {comparisons.map((comp) => (
                    <td
                      key={comp.racket_id}
                      className="px-3 py-2 text-center text-sm text-red-600"
                    >
                      {comp.worst_elo_drop}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sm text-[var(--ink)]">
                    Last Used
                  </td>
                  {comparisons.map((comp) => (
                    <td
                      key={comp.racket_id}
                      className="px-3 py-2 text-center text-sm text-[var(--ink)]"
                    >
                      {comp.last_used ? (
                        <span className="text-xs">
                          {new Date(comp.last_used).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-[var(--muted)]">Never</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-[color:var(--card-border)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[color:var(--card-border-strong)]"
          >
            Close
          </button>
          <button
            onClick={handleCompare}
            disabled={selectedRacketIds.length < 2 || isLoading}
            className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
          >
            {isLoading ? "Comparing..." : "Compare"}
          </button>
        </div>
      </div>
    </div>
  );
}
