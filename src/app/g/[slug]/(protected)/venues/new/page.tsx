import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { getGroupBySlug, isGroupMember } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BackButton, Heading } from "@/components/ui";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type VenueNewPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function VenueNewPage({ params }: VenueNewPageProps) {
  const { slug } = await params;

  async function actionCreateVenue(formData: FormData) {
    "use server";

    const group = await getGroupBySlug(slug);
    if (!group) throw new Error("Group not found");

    const member = await isGroupMember(group.id);
    if (!member) throw new Error("Not a group member");

    const name = String(formData.get("name") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const num_courts = Number(formData.get("num_courts") ?? 1);
    const surface_type = String(formData.get("surface_type") ?? "glass");
    const indoor_outdoor = String(formData.get("indoor_outdoor") ?? "indoor");
    const lighting = String(formData.get("lighting") ?? "led");

    if (!name) throw new Error("El nombre es obligatorio");
    if (!address) throw new Error("La dirección es obligatoria");
    if (!Number.isFinite(num_courts) || num_courts <= 0) {
      throw new Error("La cantidad de canchas debe ser mayor a 0");
    }

    const supabase = await createSupabaseServerClient();
    const { error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error("No hay sesión");

    const { data, error } = await supabase
      .from("venues")
      .insert({
        group_id: group.id,
        name,
        slug: slugify(name),
        address,
        num_courts,
        surface_type,
        indoor_outdoor,
        lighting,
        created_by: null,
        // venues.created_by references players(id); we don't map user -> player, so leave null
      })
      .select("slug")
      .single();

    if (error) {
      // Most common cause here is RLS (admin-only venue creation)
      console.error("create venue failed", {
        code: error.code,
        message: error.message,
        details: (error as unknown as { details?: string }).details,
        hint: (error as unknown as { hint?: string }).hint,
      });
      throw new Error(error.message);
    }

    revalidatePath(`/g/${slug}/venues`);

    if (data?.slug) {
      redirect(`/g/${slug}/venues/${data.slug}`);
    }

    redirect(`/g/${slug}/venues`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <BackButton href={`/g/${slug}/venues`} label="Volver a canchas" variant="link" />
        <Heading level={2}>Agregar cancha</Heading>
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
