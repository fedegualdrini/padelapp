"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatch } from "./actions";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type DeleteMatchButtonProps = {
  slug: string;
  matchId: string;
  matchName: string;
};

export default function DeleteMatchButton({
  slug,
  matchId,
  matchName,
}: DeleteMatchButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteMatch(slug, matchId);
        if (result.success) {
          toast.success("Partido eliminado correctamente");
          router.push(`/g/${slug}/matches`);
        } else {
          toast.error(result.error || "Error al eliminar el partido");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al eliminar el partido";
        toast.error(errorMessage);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 shadow-[0_10px_25px_rgba(239,68,68,0.15)] backdrop-blur transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 min-h-[44px]"
      >
        Eliminar partido
      </button>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="¿Eliminar este partido?"
        message={`Estás por eliminar "${matchName}". Se perderán los datos del partido y se recalcularán los rankings de ELO. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="No, volver"
        variant="danger"
        loading={isPending}
        loadingText="Eliminando..."
      />
    </>
  );
}
