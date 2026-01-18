import { joinGroup } from "./actions";

type JoinGroupPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JoinGroupPage({ params }: JoinGroupPageProps) {
  const { slug } = await params;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-16 pt-10 sm:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Acceso al grupo
        </p>
        <h1 className="font-display text-3xl text-[var(--ink)]">
          IngresÃ¡ la clave
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          UsÃ¡ la clave del grupo para habilitar el acceso a sus datos.
        </p>
      </div>

      <form
        action={joinGroup}
        className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur"
      >
        <input type="hidden" name="group_slug" value={slug} />
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Clave del grupo
          <input
            type="password"
            name="group_passphrase"
            placeholder="IngresÃ¡ la clave"
            className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
