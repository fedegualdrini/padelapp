import Link from "next/link";

import { createVenueAndRedirect } from "../actions";

type VenueNewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function VenueNewPage({ params }: VenueNewPageProps) {
  const { slug } = await params;

  async function actionCreateVenue(formData: FormData) {
    "use server";
    await createVenueAndRedirect(slug, formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/g/${slug}/venues`}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Volver a canchas
        </Link>
        <h2 className="font-display text-2xl text-[var(--ink)]">Agregar cancha</h2>
        <p className="text-sm text-[var(--muted)]">Cargá los datos principales del lugar.</p>
      </header>

      <form
        action={actionCreateVenue}
        className="max-w-xl rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur"
      >
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-[var(--ink)]">Nombre</span>
            <input
              name="name"
              required
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)]"
              placeholder="Ej: Padel Club Centro"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-semibold text-[var(--ink)]">Dirección</span>
            <input
              name="address"
              required
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)]"
              placeholder="Calle 123, Ciudad"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-semibold text-[var(--ink)]">Cantidad de canchas</span>
              <input
                name="num_courts"
                type="number"
                min={1}
                defaultValue={1}
                required
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)]"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-semibold text-[var(--ink)]">Superficie</span>
              <select
                name="surface_type"
                defaultValue="glass"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)]"
              >
                <option value="glass">Vidrio</option>
                <option value="cement">Cemento</option>
                <option value="artificial_grass">Césped sintético</option>
                <option value="other">Otra</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm font-semibold text-[var(--ink)]">Indoor/Outdoor</span>
              <select
                name="indoor_outdoor"
                defaultValue="indoor"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)]"
              >
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="both">Mixto</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-semibold text-[var(--ink)]">Iluminación</span>
              <select
                name="lighting"
                defaultValue="led"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm text-[var(--ink)]"
              >
                <option value="led">LED</option>
                <option value="fluorescent">Fluorescente</option>
                <option value="natural">Natural</option>
                <option value="none">Sin luces</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90"
            >
              Guardar
            </button>
            <Link
              href={`/g/${slug}/venues`}
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--card-border)] px-5 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[color:var(--card-border-strong)]"
            >
              Cancelar
            </Link>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Nota: si ves un error de permisos, probablemente tu usuario no sea admin del grupo (RLS).
          </p>
        </div>
      </form>
    </div>
  );
}
