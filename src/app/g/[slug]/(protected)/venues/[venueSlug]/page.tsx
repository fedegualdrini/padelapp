import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Car,
  Droplets,
  Coffee,
  Wifi,
  Package,
  ArrowLeft,
} from "lucide-react";
import type { VenueRatingBreakdown } from "@/lib/venue-types";

interface VenueDetailPageProps {
  params: Promise<{ slug: string; venueSlug: string }>;
}

const surfaceLabels: Record<string, string> = {
  glass: "Vidrio",
  cement: "Cemento",
  artificial_grass: "Césped artificial",
  other: "Otro",
};

const indoorOutdoorLabels: Record<string, string> = {
  indoor: "Interior",
  outdoor: "Exterior",
  both: "Ambos",
};

const lightingLabels: Record<string, string> = {
  led: "LED",
  fluorescent: "Fluorescente",
  natural: "Natural",
  none: "Sin iluminación",
};

function RatingBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 flex-shrink-0 text-sm text-[var(--muted)]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--card-border)]/40">
        <div className="h-full rounded-full bg-amber-500" style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-medium text-[var(--ink)]">{value.toFixed(1)}</span>
    </div>
  );
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { slug, venueSlug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  const { data: venue, error } = await supabase
    .from("venues")
    .select(
      `
      *,
      venue_analytics(*)
    `
    )
    .eq("group_id", group.id)
    .eq("slug", venueSlug)
    .single();

  if (error || !venue) {
    console.error("Error fetching venue:", error);
    notFound();
  }

  const { data: ratings } = await supabase
    .from("venue_ratings")
    .select(
      `
      *,
      player:player_id(id, name, avatar_url)
    `
    )
    .eq("venue_id", venue.id)
    .eq("group_id", group.id)
    .order("created_at", { ascending: false });

  const analytics = venue.venue_analytics?.[0];

  const ratingBreakdown: VenueRatingBreakdown =
    analytics
      ? {
          overall: analytics.avg_overall_rating,
          court_quality: analytics.avg_court_quality,
          lighting: analytics.avg_lighting,
          comfort: analytics.avg_comfort,
          amenities: analytics.avg_amenities,
          accessibility: analytics.avg_accessibility,
          atmosphere: analytics.avg_atmosphere,
        }
      : {
          overall: 0,
          court_quality: 0,
          lighting: 0,
          comfort: 0,
          amenities: 0,
          accessibility: 0,
          atmosphere: 0,
        };

  const hasRatings = analytics && analytics.total_ratings > 0;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/g/${slug}/venues`}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a canchas
      </Link>

      <header className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl text-[var(--ink)]">{venue.name}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{venue.address}</span>
            </div>
          </div>

          {hasRatings && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
              <div>
                <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                  {ratingBreakdown.overall.toFixed(1)}
                </span>
                <span className="ml-1 text-sm text-amber-600/70 dark:text-amber-400/70">/ 5</span>
              </div>
              <div className="ml-2 text-xs text-amber-600/70 dark:text-amber-400/70">
                {analytics.total_ratings} reseña{analytics.total_ratings !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>

        {(venue.phone || venue.website) && (
          <div className="mt-5 flex flex-wrap gap-4">
            {venue.phone && (
              <a
                href={`tel:${venue.phone}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <Phone className="h-4 w-4" />
                {venue.phone}
              </a>
            )}
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <Globe className="h-4 w-4" />
                Sitio web
              </a>
            )}
          </div>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Información</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--muted)]">Superficie</span>
              <span className="font-semibold text-[var(--ink)]">{surfaceLabels[venue.surface_type]}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--muted)]">Tipo</span>
              <span className="font-semibold text-[var(--ink)]">{indoorOutdoorLabels[venue.indoor_outdoor]}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--muted)]">Iluminación</span>
              <span className="font-semibold text-[var(--ink)]">{lightingLabels[venue.lighting]}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--muted)]">Canchas</span>
              <span className="font-semibold text-[var(--ink)]">{venue.num_courts}</span>
            </div>
            {venue.climate_control && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted)]">Climatización</span>
                <span className="font-semibold text-[var(--accent)]">Sí</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Servicios</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {venue.has_parking && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <Car className="h-4 w-4 text-[var(--accent)]" />
                Estacionamiento
              </div>
            )}
            {venue.has_showers && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <Droplets className="h-4 w-4 text-[var(--accent)]" />
                Duchas
              </div>
            )}
            {venue.has_changing_rooms && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <span className="text-[var(--accent)]">✓</span>
                Vestuarios
              </div>
            )}
            {venue.has_lockers && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <span className="text-[var(--accent)]">✓</span>
                Lockers
              </div>
            )}
            {venue.has_bar_restaurant && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <Coffee className="h-4 w-4 text-[var(--accent)]" />
                Bar/Restaurant
              </div>
            )}
            {venue.has_water_fountain && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <span className="text-[var(--accent)]">✓</span>
                Bebederos
              </div>
            )}
            {venue.has_wifi && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <Wifi className="h-4 w-4 text-[var(--accent)]" />
                WiFi
              </div>
            )}
            {venue.has_equipment_rental && (
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <Package className="h-4 w-4 text-[var(--accent)]" />
                Alquiler de equipos
              </div>
            )}
          </div>
        </div>
      </section>

      {hasRatings && (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-lg text-[var(--ink)]">Calificaciones</h3>
          <div className="mt-4 space-y-3">
            <RatingBar label="Calidad de cancha" value={ratingBreakdown.court_quality} />
            <RatingBar label="Iluminación" value={ratingBreakdown.lighting} />
            <RatingBar label="Comodidad" value={ratingBreakdown.comfort} />
            <RatingBar label="Servicios" value={ratingBreakdown.amenities} />
            <RatingBar label="Accesibilidad" value={ratingBreakdown.accessibility} />
            <RatingBar label="Ambiente" value={ratingBreakdown.atmosphere} />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg text-[var(--ink)]">Reseñas</h3>
          <Link
            href={`/g/${slug}/venues/${venueSlug}/rate`}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5"
          >
            <Star className="h-4 w-4" />
            Calificar
          </Link>
        </div>

        {ratings && ratings.length > 0 ? (
          <div className="mt-4 space-y-4">
            {ratings.map((rating: Record<string, unknown>) => (
              <div
                key={rating.id as string}
                className="border-b border-[color:var(--card-border)] pb-4 last:border-0 last:pb-0"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--ink)]">
                    {(rating.player as Record<string, string>)?.name || "Usuario"}
                  </span>
                  <span className="text-[var(--muted)]">•</span>
                  <span className="text-sm text-[var(--muted)]">
                    {new Date(rating.created_at as string).toLocaleDateString("es-AR")}
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={`star-${i}`}
                      className={`h-4 w-4 ${
                        i < Math.round((rating.overall_rating as number) || 0)
                          ? "fill-amber-500 text-amber-500"
                          : "text-[color:var(--card-border)]"
                      }`}
                    />
                  ))}
                </div>

                {(rating.review_text as string) && (
                  <p className="text-sm text-[var(--ink)]/90">{rating.review_text as string}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            Aún no hay reseñas. ¡Sé el primero en calificar esta cancha!
          </p>
        )}
      </section>
    </div>
  );
}
