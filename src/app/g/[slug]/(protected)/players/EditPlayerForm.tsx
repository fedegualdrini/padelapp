"use client";

import { useActionState, useState } from "react";
import { updatePlayer } from "@/app/players/actions";
import { toast } from "sonner";

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

export default function EditPlayerForm({
  playerId,
  initialName,
  groupId,
  groupSlug,
}: EditPlayerFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draftName, setDraftName] = useState(initialName);

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
        <form action={formAction} className="mt-3 grid gap-2">
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
              className="flex-1 rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftName(name);
                setIsEditing(false);
              }}
              className="rounded-full border border-[color:var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
