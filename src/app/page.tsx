import Link from "next/link";
import { createGroup } from "@/app/actions";
import { getGroups } from "@/lib/data";

export default async function Home() {
  const groups = await getGroups();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6">
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

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h2 className="font-display text-xl text-[var(--ink)]">Tus grupos</h2>
        {groups.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Aún no hay grupos creados.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/g/${group.slug}/join`}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5"
              >
                {group.name}
                <span className="mt-1 block text-xs font-normal text-[var(--muted)]">
                  Ingresar con clave
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h2 className="font-display text-xl text-[var(--ink)]">Nuevo grupo</h2>
        <form action={createGroup} className="mt-4 flex flex-wrap gap-3">
          <input
            type="text"
            name="group_name"
            placeholder="Nombre del grupo"
            className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
          />
          <input
            type="password"
            name="group_passphrase"
            placeholder="Clave del grupo"
            className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Crear grupo
          </button>
        </form>
      </section>
    </div>
  );
}
