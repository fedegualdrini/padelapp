"use client";

import { useActionState, useEffect, useRef } from "react";
import { addPlayer } from "@/app/players/actions";

type AddPlayerFormProps = {
  groupId: string;
  groupSlug: string;
};

type AddPlayerState = {
  error?: string;
  success?: boolean;
};

export default function AddPlayerForm({ groupId, groupSlug }: AddPlayerFormProps) {
  const [state, formAction] = useActionState<AddPlayerState, FormData>(
    addPlayer,
    {}
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="group_slug" value={groupSlug} />
      {state?.error ? (
        <div className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </div>
      ) : null}
      {state?.success && !state?.error ? (
        <div className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Jugador agregado.
        </div>
      ) : null}
      <input
        type="text"
        name="player_name"
        placeholder="Nombre del jugador"
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
      />
      <select
        name="player_status"
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
      >
        <option value="invite">Invitado</option>
        <option value="usual">Habitual</option>
      </select>
      <input
        type="text"
        name="created_by"
        placeholder="Agregado por (opcional)"
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        Agregar jugador
      </button>
    </form>
  );
}
