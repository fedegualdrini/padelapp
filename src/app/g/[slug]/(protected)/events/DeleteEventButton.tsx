"use client";

import { useState, useTransition } from "react";
import { deleteWeeklyEvent } from "./actions";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type DeleteEventButtonProps = {
  slug: string;
  eventId: string;
  eventName: string;
};

export default function DeleteEventButton({
  slug,
  eventId,
  eventName,
}: DeleteEventButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteWeeklyEvent(slug, eventId);
        toast.success("Evento eliminado correctamente");
        setShowConfirm(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al eliminar el evento";
        toast.error(errorMessage);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300"
      >
        Eliminar
      </button>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="¿Eliminar este evento?"
        message={`Estás por eliminar "${eventName}". Se eliminarán todas las fechas futuras asociadas. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="No, volver"
        variant="danger"
        loading={isPending}
        loadingText="Eliminando..."
      />
    </>
  );
}
