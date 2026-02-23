import type { Metadata } from "next";
import Link from "next/link";
import { createGroup } from "@/app/actions";
import { getGroups } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join or Create a Group",
  description:
    "Join or create a padel group to track your matches, ELO rankings, and partnership stats with friends.",
};

function SetupRequired() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--status-warning-bg)] flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Setup</p>
          <h1 className="font-display text-3xl text-[var(--ink)] sm:text-4xl">
            Falta configurar Supabase
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Este entorno no tiene definidas las variables de entorno necesarias para conectarse.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 sm:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <span className="text-xl">🔑</span>
          </div>
          <h2 className="font-display text-xl text-[var(--ink)]">Variables requeridas</h2>
        </div>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--status-error-bg)] flex-shrink-0 mt-0.5">
              <span className="text-xs">1</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              <span className="font-mono font-semibold text-[var(--ink)]">NEXT_PUBLIC_SUPABASE_URL</span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--status-error-bg)] flex-shrink-0 mt-0.5">
              <span className="text-xs">2</span>
            </div>
            <span className="text-sm text-[var(--muted)]">
              <span className="font-mono font-semibold text-[var(--ink)]">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            </span>
          </li>
        </ul>
        <div className="mt-5 rounded-xl bg-[var(--bg-base)] p-4 text-sm text-[var(--muted)]">
          <p>💡 Cuando estén en <span className="font-mono font-semibold text-[var(--ink)]">.env.local</span>, reiniciá el dev server.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/g/demo"
          className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:bg-[var(--accent-strong)]"
        >
          Entrar al demo
        </Link>
        <Link
          href="/join"
          className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-solid)] px-6 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)]/80"
        >
          Reintentar
        </Link>
      </div>
    </div>
  );
}

export default async function JoinPage() {
  if (!hasSupabaseEnv()) {
    return <SetupRequired />;
  }

  const groups = await getGroups();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 flex-shrink-0">
          <span className="text-2xl">🎾</span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Multi-grupo
          </p>
          <h1 className="font-display text-3xl text-[var(--ink)] sm:text-4xl">
            Elegí tu grupo
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Creá un grupo nuevo o entrá a uno existente.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 sm:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <span className="text-xl">👥</span>
          </div>
          <h2 className="font-display text-xl text-[var(--ink)]">Tus grupos</h2>
        </div>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-base)]">
              <span className="text-3xl">🎾</span>
            </div>
            <div>
              <p className="font-semibold text-[var(--ink)]">No hay grupos todavía</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Creá tu primer grupo para empezar a jugar
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/g/${group.slug}/join`}
                className="group relative overflow-hidden rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--ink)]">{group.name}</h3>
                      <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                        Activo
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                      Ingresá con la clave del grupo
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] transition group-hover:bg-[var(--accent)] group-hover:text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 sm:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <span className="text-xl">✨</span>
          </div>
          <h2 className="font-display text-xl text-[var(--ink)]">Nuevo grupo</h2>
        </div>
        <form action={createGroup} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="group_name" className="text-sm font-medium text-[var(--ink)]">
                Nombre del grupo
              </label>
              <input
                type="text"
                id="group_name"
                name="group_name"
                placeholder="Ej: Centro Padel Norte"
                aria-label="Nombre del grupo"
                autoComplete="off"
                className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-3 text-sm placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="group_passphrase" className="text-sm font-medium text-[var(--ink)]">
                Clave de acceso
              </label>
              <input
                type="password"
                id="group_passphrase"
                name="group_passphrase"
                placeholder="Ej: cancha2026"
                aria-label="Clave del grupo"
                autoComplete="off"
                className="w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-3 text-sm placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
            >
              Crear grupo
            </button>
            <p className="text-xs text-[var(--muted)]">
              Compartí la clave con tu equipo
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
