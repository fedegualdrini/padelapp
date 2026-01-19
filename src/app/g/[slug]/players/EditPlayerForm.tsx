"use client";

import { useActionState, useState } from "react";
import { updatePlayer } from "@/app/players/actions";

type EditPlayerFormProps = {
  playerId: string;
  initialName: string;
  groupId: string;
  groupSlug: string;
};

type UpdatePlayerState = {
  error?: string;
  success?: boolean;
  name?: string;
  editKey?: string;
};

export default function EditPlayerForm({
  playerId,
  initialName,
  groupId,
  groupSlug,
}: EditPlayerFormProps) {
  const [state, formAction] = useActionState<UpdatePlayerState, FormData>(
    updatePlayer,
    {}
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editKey, setEditKey] = useState(0);

  const nameToShow = state?.name ?? initialName;
  const currentEditKey = String(editKey);
  const closeOnSuccess = state?.success && state?.editKey === currentEditKey;
  const showEditor = isEditing && !closeOnSuccess;

  const handleStartEdit = () => {
    setDraftName(nameToShow);
    setIsEditing(true);
    setEditKey((value) => value + 1);
  };

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-[var(--ink)]">{nameToShow}</p>
        {!showEditor && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="rounded-full border border-[color:var(--card-border)] px-3 py-1 text-xs font-semibold text-[var(--ink)]"
          >
            Editar
          </button>
        )}
      </div>

      {showEditor && (
        <form action={formAction} className="mt-3 grid gap-2">
          <input type="hidden" name="player_id" value={playerId} />
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="group_slug" value={groupSlug} />
          <input type="hidden" name="edit_key" value={currentEditKey} />

          {state?.error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {state.error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="player_name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Nuevo nombre"
              className="flex-1 rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-full border border-[color:var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
