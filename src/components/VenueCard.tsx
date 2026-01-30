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
      className="block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow overflow-hidden"
      data-testid="venue-card"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate">
              {v.name}
            </h3>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{v.address}</span>
            </div>
          </div>
          
          {/* Rating Badge */}
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg flex-shrink-0">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {hasRatings ? avgRating.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
              ({analytics.total_ratings})
            </span>
          </div>
        </div>

        {/* Attributes */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-300">
            <Circle className="w-3 h-3" />
            {surfaceLabels[v.surface_type]}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-300">
            <Sun className="w-3 h-3" />
            {indoorOutdoorLabels[v.indoor_outdoor]}
          </span>
          {v.num_courts > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-300">
              {v.num_courts} cancha{v.num_courts > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Amenities */}
        <div className="flex gap-3 mb-4">
          {v.has_parking && (
            <div className="text-slate-400 dark:text-slate-500" title="Estacionamiento">
              <Car className="w-4 h-4" />
            </div>
          )}
          {v.has_showers && (
            <div className="text-slate-400 dark:text-slate-500" title="Duchas">
              <Droplets className="w-4 h-4" />
            </div>
          )}
          {v.has_bar_restaurant && (
            <div className="text-slate-400 dark:text-slate-500" title="Bar/Restaurant">
              <Coffee className="w-4 h-4" />
            </div>
          )}
          {v.has_wifi && (
            <div className="text-slate-400 dark:text-slate-500" title="WiFi">
              <Wifi className="w-4 h-4" />
            </div>
          )}
          {v.has_equipment_rental && (
            <div className="text-slate-400 dark:text-slate-500" title="Alquiler de equipos">
              <Package className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
          <span>
            {matches_played > 0 ? `${matches_played} partidos jugados` : "Sin partidos aún"}
          </span>
          {last_played_at && (
            <span>
              Último: {new Date(last_played_at).toLocaleDateString("es-ES", {
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
