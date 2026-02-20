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
      className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 sm:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      <input type="hidden" name="group_slug" value={slug} />

      {state?.error && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--status-error-strong)]/20 bg-[var(--status-error-bg)] px-4 py-3 text-sm text-[var(--status-error-text)]"
          role="status"
          aria-live="polite"
        >
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--status-error-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="group_passphrase" className="text-sm font-semibold text-[var(--ink)]">
            Clave del grupo
          </label>
          <div className="relative">
            <input
              type="password"
              id="group_passphrase"
              name="group_passphrase"
              placeholder="Ingresá la clave del grupo"
              autoComplete="off"
              className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-3 text-sm placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
          <p className="text-xs text-[var(--muted)]">
            Pedile la clave al administrador del grupo
          </p>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        >
          Ingresar al grupo
        </button>
      </div>
    </form>
  );
}
