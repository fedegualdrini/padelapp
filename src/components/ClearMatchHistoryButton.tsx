"use client";

import { useTransition } from "react";
import { clearMatchHistory } from "@/app/g/[slug]/(protected)/matches/actions";

type Props = {
  slug: string;
  disabled?: boolean;
};

export default function ClearMatchHistoryButton({ slug, disabled }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        const first = window.confirm(
          "Esto borra TODOS los partidos del grupo (y su historial de ELO). ¿Seguro?"
        );
        if (!first) return;

        const second = window.confirm(
          "Última confirmación: se va a borrar TODO el historial. Esto no se puede deshacer."
        );
        if (!second) return;

        startTransition(async () => {
          try {
            await clearMatchHistory(slug);
          } catch (e) {
            const msg =
              e instanceof Error
                ? e.message
                : typeof e === "string"
                  ? e
                  : "Error";
            alert(msg);
          }
        });
      }}
      className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-[0_10px_25px_rgba(239,68,68,0.15)] backdrop-blur transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 min-h-[44px]"
    >
      {pending ? "Borrando…" : "Borrar historial"}
    </button>
  );
}
