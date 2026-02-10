"use client";

import { useState, useTransition } from "react";
import { cancelOccurrence } from "./actions";

export default function CancelOccurrenceButton({
  slug,
  occurrenceId,
  disabled,
}: {
  slug: string;
  occurrenceId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDisabled = disabled || isPending;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={isDisabled}
        className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-solid)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        title="Marcar esta fecha como No se jugó"
      >
        No se jugó
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)] backdrop-blur">
            <h3 className="font-display text-xl text-[var(--ink)]">
              ¿Marcar como &quot;No se jugó&quot;?
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Esto va a cancelar la fecha actual y quedará en historial.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-full border border-[color:var(--card-border)] px-5 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await cancelOccurrence(slug, occurrenceId);
                      setOpen(false);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Error cancelando la fecha");
                    }
                  });
                }}
                disabled={isPending}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
