import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug } from "@/lib/data";
import { VenueCard } from "@/components/VenueCard";
import { Plus, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { VenueListItem } from "@/lib/venue-types";

interface VenuesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VenuesPage({ params }: VenuesPageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  const { data: venues, error } = await supabase
    .from("venues")
    .select(
      `
      *,
      venue_analytics(*)
    `
    )
    .eq("group_id", group.id)
    .order("name");

  if (error) {
    console.error("Error fetching venues:", error);
  }

  const venueListItems: VenueListItem[] = (venues || []).map((v: Record<string, unknown>) => ({
    venue: {
      id: v.id as string,
      group_id: v.group_id as string,
      name: v.name as string,
      slug: v.slug as string,
      address: v.address as string,
      website: v.website as string | null,
      phone: v.phone as string | null,
      num_courts: v.num_courts as number,
      surface_type: v.surface_type as "glass" | "cement" | "artificial_grass" | "other",
      indoor_outdoor: v.indoor_outdoor as "indoor" | "outdoor" | "both",
      lighting: v.lighting as "led" | "fluorescent" | "natural" | "none",
      climate_control: v.climate_control as boolean,
      has_showers: v.has_showers as boolean,
      has_changing_rooms: v.has_changing_rooms as boolean,
      has_lockers: v.has_lockers as boolean,
      has_parking: v.has_parking as boolean,
      has_bar_restaurant: v.has_bar_restaurant as boolean,
      has_water_fountain: v.has_water_fountain as boolean,
      has_wifi: v.has_wifi as boolean,
      has_equipment_rental: v.has_equipment_rental as boolean,
      photos: (v.photos as string[]) || [],
      created_at: v.created_at as string,
      updated_at: v.updated_at as string,
      created_by: v.created_by as string | null,
    },
    analytics:
      ((v.venue_analytics as unknown[] | null)?.[0] as VenueListItem["analytics"]) || {
        venue_id: v.id as string,
        group_id: v.group_id as string,
        name: v.name as string,
        slug: v.slug as string,
        total_ratings: 0,
        avg_overall_rating: 0,
        avg_court_quality: 0,
        avg_lighting: 0,
        avg_comfort: 0,
        avg_amenities: 0,
        avg_accessibility: 0,
        avg_atmosphere: 0,
        total_helpful_votes: 0,
        total_not_helpful_votes: 0,
        total_comments: 0,
        last_rating_at: null,
        last_updated_at: new Date().toISOString(),
      },
    last_played_at: null,
    matches_played: 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-[var(--ink)]">Canchas y clubes</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Descubrí y calificá los lugares donde jugamos.
          </p>
        </div>

        <Link
          href={`/g/${slug}/venues/new`}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--accent)]/90"
        >
          <Plus className="h-4 w-4" />
          Agregar cancha
        </Link>
      </header>

      {venueListItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venueListItems.map((venue) => (
            <VenueCard key={venue.venue.id} venue={venue} groupSlug={slug} />
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-10 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
          <h3 className="font-display text-lg text-[var(--ink)]">No hay canchas registradas</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
            Agregá las canchas donde tu grupo juega para que todos puedan calificarlas y compartir sus opiniones.
          </p>
          <Link
            href={`/g/${slug}/venues/new`}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--accent)]/90"
          >
            <Plus className="h-4 w-4" />
            Agregar primera cancha
          </Link>
        </section>
      )}
    </div>
  );
}
