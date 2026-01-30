import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug } from "@/lib/data";
import { VenueCard } from "@/components/VenueCard";
import { Button } from "@/components/ui/button";
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
  
  // Fetch venues with analytics
  const { data: venues, error } = await supabase
    .from("venues")
    .select(`
      *,
      venue_analytics(*)
    `)
    .eq("group_id", group.id)
    .order("name");

  if (error) {
    console.error("Error fetching venues:", error);
  }

  // Transform to VenueListItem format
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
    analytics: (v.venue_analytics as unknown[] | null)?.[0] as VenueListItem['analytics'] || {
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
    last_played_at: null, // TODO: Add match history
    matches_played: 0, // TODO: Add match count
  }));

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Canchas y Clubes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Descubre y califica los lugares donde jugamos
          </p>
        </div>
        <Link href={`/g/${slug}/venues/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Agregar cancha
          </Button>
        </Link>
      </div>

      {/* Venues Grid */}
      {venueListItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venueListItems.map((venue) => (
            <VenueCard key={venue.venue.id} venue={venue} groupSlug={slug} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No hay canchas registradas
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Agrega las canchas donde tu grupo juega para que todos puedan calificarlas y compartir sus opiniones.
          </p>
          <Link href={`/g/${slug}/venues/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar primera cancha
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
