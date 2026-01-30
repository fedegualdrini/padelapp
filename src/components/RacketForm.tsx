"use client";

import { useState } from "react";
import type { Racket, RacketInput } from "@/lib/racket-types";

type RacketFormProps = {
  racket?: Racket | null;
  onSubmit: (data: RacketInput) => Promise<void>;
  onCancel: () => void;
};

export default function RacketForm({ racket, onSubmit, onCancel }: RacketFormProps) {
  const [brand, setBrand] = useState(racket?.brand || "");
  const [model, setModel] = useState(racket?.model || "");
  const [weight, setWeight] = useState(racket?.weight?.toString() || "");
  const [balance, setBalance] = useState(racket?.balance?.toString() || "");
  const [purchaseDate, setPurchaseDate] = useState(racket?.purchase_date || "");
  const [isActive, setIsActive] = useState(racket?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim() || !model.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        brand: brand.trim(),
        model: model.trim(),
        weight: weight ? parseInt(weight, 10) : null,
        balance: balance ? parseInt(balance, 10) : null,
        purchase_date: purchaseDate || null,
        is_active: isActive,
      });
    } catch (error) {
      console.error("Error submitting racket form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-6 shadow-xl">
        <div className="mb-6">
          <h3 className="font-display text-xl text-[var(--ink)]">
            {racket ? "Edit Racket" : "Add Racket"}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {racket ? "Update racket details" : "Add a new racket to your collection"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Brand *
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Bullpadel"
                required
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm focus:border-[color:var(--accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Model *
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., Vertex 03"
                required
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm focus:border-[color:var(--accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Weight (g)
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="360"
                min="300"
                max="400"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm focus:border-[color:var(--accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
              Balance (mm)
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="265"
                min="250"
                max="310"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm focus:border-[color:var(--accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Purchase Date
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm focus:border-[color:var(--accent)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
            />
          </label>

          {racket && (
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-[color:var(--card-border)] text-[color:var(--accent)] focus:ring-[color:var(--accent)]"
              />
              Active racket
            </label>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-[color:var(--card-border)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[color:var(--card-border-strong)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : racket ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
