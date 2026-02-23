"use client";

import Link from "next/link";
import { useState } from "react";

interface VenueCardProps {
  id: string;
  slug: string;
  name: string;
  location: string;
  distance?: string;
  courtCount: number;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  type?: "indoor" | "outdoor";
  isPremium?: boolean;
  isTopRated?: boolean;
}

export function VenueCard({
  id,
  slug,
  name,
  location,
  distance,
  courtCount,
  hourlyRate,
  rating,
  reviewCount,
  imageUrl,
  type,
  isPremium,
  isTopRated,
}: VenueCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="group bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-primary/20">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {isPremium && (
            <span className="px-3 py-1 bg-charcoal/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              Premium
            </span>
          )}
          {isTopRated && (
            <span className="px-3 py-1 bg-charcoal/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              Top Rated
            </span>
          )}
          {type && (
            <span
              className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                type === "indoor"
                  ? "bg-primary text-background-dark"
                  : "bg-blue-500 text-white"
              }`}
            >
              {type}
            </span>
          )}
        </div>
        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all"
        >
          <span className="material-symbols-outlined text-xl">
            {isFavorited ? "favorite" : "favorite_border"}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-800 text-background-dark dark:text-white leading-tight">
              {name}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`material-symbols-outlined text-sm ${
                    i < Math.floor(rating)
                      ? "text-primary fill-current"
                      : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  star
                </span>
              ))}
              <span className="text-xs font-bold text-slate-500 ml-1">
                {rating.toFixed(1)} ({reviewCount} reviews)
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-primary font-800 text-lg">
              £{Math.floor(hourlyRate / 100)}
              <span className="text-xs font-normal text-slate-500">/hr</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 py-3 border-y border-slate-100 dark:border-white/5 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-slate-400 text-sm">
              location_on
            </span>
            <span className="text-xs font-medium text-slate-500">
              {distance || "0.1 miles away"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-slate-400 text-sm">
              sports_tennis
            </span>
            <span className="text-xs font-medium text-slate-500">{courtCount} Courts</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/venues/${slug}/book`}
            className="flex-1 bg-primary text-background-dark font-bold py-2.5 rounded-xl hover:brightness-105 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">event_available</span>
            Book Court
          </Link>
          <Link
            href={`/venues/${slug}`}
            className="w-12 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-500 hover:border-primary transition-all"
          >
            <span className="material-symbols-outlined">info</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
