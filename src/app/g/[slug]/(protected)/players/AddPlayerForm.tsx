"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { addPlayer } from "@/app/players/actions";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";

type AddPlayerFormProps = {
  groupId: string;
  groupSlug: string;
};

type AddPlayerState = {
  error?: string;
  success?: boolean;
};

export default function AddPlayerForm({ groupId, groupSlug }: AddPlayerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState<AddPlayerState, FormData>(
    addPlayer,
    {}
  );
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      toast.success("Jugador agregado correctamente");
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.success, state?.error]);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form
      ref={formRef}
      id="add-player"
      action={handleSubmit}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="group_slug" value={groupSlug} />
      <input
        type="text"
        name="player_name"
        placeholder="Nombre del jugador (ej: Martina?)"
        aria-label="Nombre del jugador"
        autoComplete="off"
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
      />
      <select
        name="player_status"
        aria-label="Estado del jugador"
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
      >
        <option value="invite">Invitado</option>
        <option value="usual">Habitual</option>
      </select>
      <input
        type="text"
        name="created_by"
        placeholder="Agregado por (opcional, ej: Fede?)"
        aria-label="Agregado por"
        autoComplete="off"
        className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50"
      >
        {isPending && <Spinner size="sm" />}
        {isPending ? "Agregando..." : "Agregar jugador"}
      </button>
    </form>
  );
}
