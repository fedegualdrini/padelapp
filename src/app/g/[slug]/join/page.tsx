import JoinForm from "./JoinForm";

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
          Ingresá la clave
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Usá la clave del grupo para habilitar el acceso a sus datos.
        </p>
      </div>

      <JoinForm slug={slug} />
    </div>
  );
}
