"use client";

import { useState, useTransition } from "react";
import { clearMatchHistory } from "@/app/g/[slug]/(protected)/matches/actions";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Props = {
  slug: string;
  disabled?: boolean;
};

export default function ClearMatchHistoryButton({ slug, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await clearMatchHistory(slug);
        setShowConfirm(false);
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
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => setShowConfirm(true)}
        className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-[0_10px_25px_rgba(239,68,68,0.15)] backdrop-blur transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 min-h-[44px]"
      >
        {pending ? "Borrando…" : "Borrar historial"}
      </button>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title="¿Borrar todo el historial?"
        message="Esto eliminará TODOS los partidos del grupo y su historial de ELO. Esta acción no se puede deshacer."
        confirmText="Sí, borrar todo"
        cancelText="No, volver"
        variant="danger"
        loading={pending}
        loadingText="Borrando..."
      />
    </>
  );
}
