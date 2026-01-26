"use client";

import { useActionState } from "react";
import { joinGroup } from "./actions";

type JoinFormProps = {
  slug: string;
};

export default function JoinForm({ slug }: JoinFormProps) {
  const [state, formAction] = useActionState(joinGroup, null);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      <input type="hidden" name="group_slug" value={slug} />

      {state?.error && (
        <div
          className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          role="status"
          aria-live="polite"
        >
          {state.error}
        </div>
      )}

      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        Clave del grupo
        <input
          type="password"
          name="group_passphrase"
          placeholder="Ingresá la clave (ej: cancha2026?)"
          autoComplete="off"
          className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        className="mt-4 w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
      >
        Ingresar
      </button>
    </form>
  );
}
