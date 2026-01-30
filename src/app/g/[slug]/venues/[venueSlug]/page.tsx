import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  ArrowLeft
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
      <span className="text-sm text-slate-600 dark:text-slate-400 w-32 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-10 text-right">
        {value.toFixed(1)}
      </span>
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
  
  // Fetch venue with analytics
  const { data: venue, error } = await supabase
    .from("venues")
    .select(`
      *,
      venue_analytics(*)
    `)
    .eq("group_id", group.id)
    .eq("slug", venueSlug)
    .single();

  if (error || !venue) {
    console.error("Error fetching venue:", error);
    notFound();
  }

  // Fetch ratings with player info
  const { data: ratings } = await supabase
    .from("venue_ratings")
    .select(`
      *,
      player:player_id(id, name, avatar_url)
    `)
    .eq("venue_id", venue.id)
    .eq("group_id", group.id)
    .order("created_at", { ascending: false });

  const analytics = venue.venue_analytics?.[0];
  
  const ratingBreakdown: VenueRatingBreakdown = analytics ? {
    overall: analytics.avg_overall_rating,
    court_quality: analytics.avg_court_quality,
    lighting: analytics.avg_lighting,
    comfort: analytics.avg_comfort,
    amenities: analytics.avg_amenities,
    accessibility: analytics.avg_accessibility,
    atmosphere: analytics.avg_atmosphere,
  } : {
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Link */}
      <Link
        href={`/g/${slug}/venues`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a canchas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {venue.name}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <MapPin className="w-4 h-4" />
            {venue.address}
          </div>
        </div>
        
        {hasRatings && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <div>
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {ratingBreakdown.overall.toFixed(1)}
              </span>
              <span className="text-sm text-amber-600/70 dark:text-amber-400/70 ml-1">
                / 5
              </span>
            </div>
            <div className="text-xs text-amber-600/70 dark:text-amber-400/70 ml-2">
              {analytics.total_ratings} reseña{analytics.total_ratings !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="flex flex-wrap gap-4 mb-6">
        {venue.phone && (
          <a
            href={`tel:${venue.phone}`}
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <Phone className="w-4 h-4" />
            {venue.phone}
          </a>
        )}
        {venue.website && (
          <a
            href={venue.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <Globe className="w-4 h-4" />
            Sitio web
          </a>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4">
            Información
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Superficie</span>
              <span className="font-medium">{surfaceLabels[venue.surface_type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Tipo</span>
              <span className="font-medium">{indoorOutdoorLabels[venue.indoor_outdoor]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Iluminación</span>
              <span className="font-medium">{lightingLabels[venue.lighting]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Canchas</span>
              <span className="font-medium">{venue.num_courts}</span>
            </div>
            {venue.climate_control && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Climatización</span>
                <span className="font-medium text-green-600">Sí</span>
              </div>
            )}
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4">
            Servicios
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {venue.has_parking && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Car className="w-4 h-4 text-green-500" />
                Estacionamiento
              </div>
            )}
            {venue.has_showers && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Droplets className="w-4 h-4 text-green-500" />
                Duchas
              </div>
            )}
            {venue.has_changing_rooms && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-green-500">✓</span>
                Vestuarios
              </div>
            )}
            {venue.has_lockers && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-green-500">✓</span>
                Lockers
              </div>
            )}
            {venue.has_bar_restaurant && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Coffee className="w-4 h-4 text-green-500" />
                Bar/Restaurant
              </div>
            )}
            {venue.has_water_fountain && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="text-green-500">✓</span>
                Bebederos
              </div>
            )}
            {venue.has_wifi && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Wifi className="w-4 h-4 text-green-500" />
                WiFi
              </div>
            )}
            {venue.has_equipment_rental && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Package className="w-4 h-4 text-green-500" />
                Alquiler de equipos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ratings Breakdown */}
      {hasRatings && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4">
            Calificaciones
          </h2>
          <div className="space-y-3">
            <RatingBar label="Calidad de cancha" value={ratingBreakdown.court_quality} />
            <RatingBar label="Iluminación" value={ratingBreakdown.lighting} />
            <RatingBar label="Comodidad" value={ratingBreakdown.comfort} />
            <RatingBar label="Servicios" value={ratingBreakdown.amenities} />
            <RatingBar label="Accesibilidad" value={ratingBreakdown.accessibility} />
            <RatingBar label="Ambiente" value={ratingBreakdown.atmosphere} />
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
            Reseñas
          </h2>
          <Link href={`/g/${slug}/venues/${venueSlug}/rate`}>
            <Button variant="outline">
              <Star className="w-4 h-4 mr-2" />
              Calificar
            </Button>
          </Link>
        </div>

        {ratings && ratings.length > 0 ? (
          <div className="space-y-4">
            {ratings.map((rating: Record<string, unknown>) => (
              <div
                key={rating.id as string}
                className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {(rating.player as Record<string, string>)?.name || "Usuario"}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(rating.created_at as string).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={`star-${i}`}
                      className={`w-4 h-4 ${
                        i < Math.round((rating.overall_rating as number) || 0)
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  ))}
                </div>
                {(rating.review_text as string) && (
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    {rating.review_text as string}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            Aún no hay reseñas. ¡Sé el primero en calificar esta cancha!
          </p>
        )}
      </div>
    </div>
  );
}
