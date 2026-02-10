"use client";

import { useState } from "react";
import RacketForm from "@/components/RacketForm";
import type { RacketInput } from "@/lib/racket-types";

interface AddRacketButtonProps {
  onAddRacket: (data: RacketInput) => Promise<void>;
}

export function AddRacketButton({ onAddRacket }: AddRacketButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (data: RacketInput) => {
    await onAddRacket(data);
    setShowModal(false);
  };

  return (
    <>
      <button
        className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90"
        onClick={() => setShowModal(true)}
      >
        + Add Racket
      </button>
      
      {showModal && (
        <RacketForm
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export function CompareRacketsButton() {
  const handleClick = () => {
    (window as { openCompareRacketsModal?: boolean }).openCompareRacketsModal = true;
  };

  return (
    <button
      className="rounded-xl border border-[color:var(--card-border)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[color:var(--card-border-strong)]"
      onClick={handleClick}
    >
      Compare
    </button>
  );
}

interface RacketCardProps {
  racket: {
    id: string;
    brand: string;
    model: string;
    weight?: number | null;
    stats?: {
      matches_played: number;
      win_rate: number;
      elo_change: number;
    } | null;
  };
  onClick: () => void;
}

export function RacketCard({ racket, onClick }: RacketCardProps) {
  return (
    <div
      className="cursor-pointer rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 transition hover:border-[color:var(--accent)]"
      onClick={onClick}
    >
      <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
        {racket.brand} {racket.model}
      </h3>
      {racket.weight && (
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {racket.weight}g
        </p>
      )}
      {racket.stats && racket.stats.matches_played > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[color:var(--input-bg)] p-2.5">
            <p className="text-xs font-semibold text-[var(--muted)]">
              Win Rate
            </p>
            <p className="mt-0.5 font-display text-lg text-emerald-600">
              {Math.round(racket.stats.win_rate * 100)}%
            </p>
          </div>
          <div className="rounded-xl bg-[color:var(--input-bg)] p-2.5">
            <p className="text-xs font-semibold text-[var(--muted)]">
              ELO Change
            </p>
            <p className={`mt-0.5 font-display text-lg ${racket.stats.elo_change >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {racket.stats.elo_change > 0 ? "+" : ""}{Math.round(racket.stats.elo_change)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--muted)]">
          No matches played yet
        </p>
      )}
    </div>
  );
}

interface RacketsListProps {
  rackets: Array<{
    id: string;
    brand: string;
    model: string;
    weight?: number | null;
    stats?: {
      matches_played: number;
      win_rate: number;
      elo_change: number;
    } | null;
  }>;
  slug: string;
  playerId: string;
}

export function RacketsList({ rackets, slug, playerId }: RacketsListProps) {
  const handleRacketClick = (racketId: string) => {
    window.location.assign(`/g/${slug}/players/${playerId}/rackets/${racketId}`);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rackets.map((racket) => (
        <RacketCard
          key={racket.id}
          racket={racket}
          onClick={() => handleRacketClick(racket.id)}
        />
      ))}
    </div>
  );
}
