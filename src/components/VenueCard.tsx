"use client";

import { Star, MapPin, Sun, Car, Droplets, Coffee, Wifi, Package, Circle } from "lucide-react";
import Link from "next/link";
import type { VenueListItem } from "@/lib/venue-types";

interface VenueCardProps {
  venue: VenueListItem;
  groupSlug: string;
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

export function VenueCard({ venue, groupSlug }: VenueCardProps) {
  const { venue: v, analytics, last_played_at, matches_played } = venue;

  const avgRating = analytics.avg_overall_rating;
  const hasRatings = analytics.total_ratings > 0;

  return (
    <Link
      href={`/g/${groupSlug}/venues/${v.slug}`}
      className="block overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur transition hover:-translate-y-0.5"
      data-testid="venue-card"
    >
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg text-[var(--ink)]">{v.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-[var(--muted)]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{v.address}</span>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-2.5 py-1">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-semibold text-[var(--ink)]">{hasRatings ? avgRating.toFixed(1) : "—"}</span>
            <span className="text-xs text-[var(--muted)]">({analytics.total_ratings})</span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-1 text-xs text-[var(--muted)]">
            <Circle className="h-3 w-3" />
            {surfaceLabels[v.surface_type]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-1 text-xs text-[var(--muted)]">
            <Sun className="h-3 w-3" />
            {indoorOutdoorLabels[v.indoor_outdoor]}
          </span>
          {v.num_courts > 0 && (
            <span className="inline-flex items-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-1 text-xs text-[var(--muted)]">
              {v.num_courts} cancha{v.num_courts > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mb-4 flex gap-3 text-[var(--muted)]">
          {v.has_parking && (
            <div title="Estacionamiento">
              <Car className="h-4 w-4" />
            </div>
          )}
          {v.has_showers && (
            <div title="Duchas">
              <Droplets className="h-4 w-4" />
            </div>
          )}
          {v.has_bar_restaurant && (
            <div title="Bar / Restaurante">
              <Coffee className="h-4 w-4" />
            </div>
          )}
          {v.has_wifi && (
            <div title="WiFi">
              <Wifi className="h-4 w-4" />
            </div>
          )}
          {v.has_equipment_rental && (
            <div title="Alquiler de equipos">
              <Package className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[color:var(--card-border)] pt-3 text-xs text-[var(--muted)]">
          <span>{matches_played > 0 ? `${matches_played} partidos jugados` : "Sin partidos todavía"}</span>
          {last_played_at && (
            <span>
              Último: {new Date(last_played_at).toLocaleDateString("es-AR", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
