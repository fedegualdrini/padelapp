"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePlayer, removePlayer } from "@/app/players/actions";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type EditPlayerFormProps = {
  playerId: string;
  initialName: string;
  groupId: string;
  groupSlug: string;
};

type UpdatePlayerState = {
  error?: string;
  success?: boolean;
};

type RemovePlayerState = {
  error?: string;
  success?: boolean;
};

export default function EditPlayerForm({
  playerId,
  initialName,
  groupId,
  groupSlug,
}: EditPlayerFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draftName, setDraftName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Wrap the server action so we can update local UI state *outside* of an effect.
  const [state, formAction] = useActionState<UpdatePlayerState, FormData>(
    async (prev, formData) => {
      const result = await updatePlayer(prev, formData);
      if (result?.success) {
        const nextName = String(formData.get("player_name") ?? "").trim();
        setName(nextName || name);
        setDraftName(nextName || name);
        setIsEditing(false);
        toast.success("Jugador actualizado correctamente");
      } else if (result?.error) {
        toast.error(result.error);
      }
      return result;
    },
    {}
  );

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

  const handleRemovePlayer = async () => {
    setIsRemoving(true);
    try {
      const formData = new FormData();
      formData.append("player_id", playerId);
      formData.append("group_id", groupId);
      formData.append("group_slug", groupSlug);
      
      const result = await removePlayer(null, formData);
      
      if (result?.success) {
        toast.success("Jugador eliminado correctamente");
        setShowRemoveConfirm(false);
        setIsEditing(false);
        router.refresh();
      } else if (result?.error) {
        toast.error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el jugador";
      toast.error(errorMessage);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between gap-3">
        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setDraftName(name);
              setIsEditing(true);
            }}
            className="rounded-full border border-[color:var(--card-border)] px-3 py-1 text-xs font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          >
            Editar
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <form action={handleSubmit} className="mt-3 grid gap-2">
          <input type="hidden" name="player_id" value={playerId} />
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="group_slug" value={groupSlug} />

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="player_name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Nuevo nombre (ej: Nico?)"
              aria-label="Nuevo nombre del jugador"
              autoComplete="off"
              disabled={isPending}
              className="flex-1 rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-1.5 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50"
            >
              {isPending && <Spinner size="sm" />}
              {isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftName(name);
                setIsEditing(false);
              }}
              disabled={isPending}
              className="rounded-full border border-[color:var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={isPending}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50 dark:text-red-300"
            >
              Eliminar
            </button>
          </div>
        </form>
      ) : null}

      <ConfirmDialog
        open={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemovePlayer}
        title="¿Eliminar este jugador?"
        message={`Estás por eliminar a "${name}". Si no tiene partidos registrados, se eliminará permanentemente. Si tiene partidos, no se podrá eliminar (podés cambiar su estado a "invitado" en su lugar).`}
        confirmText="Sí, eliminar"
        cancelText="No, volver"
        variant="danger"
        loading={isRemoving}
        loadingText="Eliminando..."
      />
    </div>
  );
}
