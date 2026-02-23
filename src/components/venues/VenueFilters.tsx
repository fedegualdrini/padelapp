"use client";

interface VenueFiltersProps {
  onFilterChange?: (filters: VenueFiltersState) => void;
}

export interface VenueFiltersState {
  search: string;
  type: "all" | "indoor" | "outdoor";
  coaching: boolean;
  proShop: boolean;
  equipmentRental: boolean;
}

export function VenueFilters({ onFilterChange }: VenueFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<VenueFiltersState>({
    search: "",
    type: "all",
    coaching: false,
    proShop: false,
    equipmentRental: false,
  });

  const handleFilterToggle = (key: keyof VenueFiltersState) => {
    const newFilters = {
      ...activeFilters,
      [key]: !activeFilters[key],
    };
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <section className="bg-white dark:bg-background-dark border-b border-primary/5 sticky top-16 z-40">
      <div className="max-w-[1440px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-background-dark/40 dark:text-slate-500">
              search
            </span>
            <input
              type="text"
              placeholder="Search venues, cities, or clubs..."
              className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm transition-all"
              value={activeFilters.search}
              onChange={(e) =>
                setActiveFilters({ ...activeFilters, search: e.target.value })
              }
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark font-bold rounded-xl text-sm hover:brightness-105 transition-all">
            <span className="material-symbols-outlined text-sm">tune</span>
            Filters
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          <button
            onClick={() => handleFilterToggle("type")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
              activeFilters.type !== "all"
                ? "border-primary/20 bg-primary/10 text-background-dark dark:text-primary"
                : "border-slate-200 dark:border-white/10 text-background-dark/60 dark:text-slate-400"
            }`}
          >
            Indoor/Outdoor
          </button>
          <button
            onClick={() => handleFilterToggle("coaching")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
              activeFilters.coaching
                ? "border-primary/20 bg-primary/10 text-background-dark dark:text-primary"
                : "border-slate-200 dark:border-white/10 text-background-dark/60 dark:text-slate-400"
            }`}
          >
            Coaching
          </button>
          <button
            onClick={() => handleFilterToggle("proShop")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
              activeFilters.proShop
                ? "border-primary/20 bg-primary/10 text-background-dark dark:text-primary"
                : "border-slate-200 dark:border-white/10 text-background-dark/60 dark:text-slate-400"
            }`}
          >
            Pro-Shop
          </button>
          <button
            onClick={() => handleFilterToggle("equipmentRental")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
              activeFilters.equipmentRental
                ? "border-primary/20 bg-primary/10 text-background-dark dark:text-primary"
                : "border-slate-200 dark:border-white/10 text-background-dark/60 dark:text-slate-400"
            }`}
          >
            Equipment Rental
          </button>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
