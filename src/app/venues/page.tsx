import { VenueFilters } from "@/components/venues/VenueFilters";
import { VenueCard } from "@/components/venues/VenueCard";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getVenues() {
  const supabase = await createSupabaseServerClient();

  const { data: venues, error } = await supabase
    .from("venues")
    .select(`
      id,
      name,
      slug,
      address,
      city,
      num_courts,
      indoor_outdoor,
      surface_type,
      hourly_rate_cents,
      latitude,
      longitude,
      description,
      amenities
    `)
    .order("name", { ascending: true });

  if (error || !venues) {
    console.error("Error fetching venues:", error);
    return [];
  }

  return venues.map((venue) => ({
    id: venue.id,
    slug: venue.slug || venue.id,
    name: venue.name,
    location: venue.address || venue.city || "Location unknown",
    distance: null, // TODO: Calculate from user location
    courtCount: venue.num_courts || 0,
    hourlyRate: venue.hourly_rate_cents || 0,
    rating: null, // TODO: Add ratings to venues table
    reviewCount: 0,
    imageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
    type: venue.indoor_outdoor === "indoor" ? ("indoor" as const) : venue.indoor_outdoor === "outdoor" ? ("outdoor" as const) : undefined,
  }));
}

export default async function VenuesPage() {
  const venues = await getVenues();

  return (
    <MarketingShell>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* Left Pane: Map */}
        <div className="hidden lg:block w-7/12 relative bg-slate-200 dark:bg-slate-800">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200"
              alt="Map View"
              className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-normal"
            />
            {/* TODO: Add real map pins based on venue coordinates */}
          </div>
          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white dark:bg-background-dark rounded-lg shadow-lg flex items-center justify-center text-background-dark dark:text-white hover:bg-primary transition-colors">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="w-10 h-10 bg-white dark:bg-background-dark rounded-lg shadow-lg flex items-center justify-center text-background-dark dark:text-white hover:bg-primary transition-colors">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button className="w-10 h-10 bg-white dark:bg-background-dark rounded-lg shadow-lg flex items-center justify-center text-background-dark dark:text-white hover:bg-primary transition-colors">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Scrollable Feed */}
        <div className="w-full lg:w-5/12 bg-background-light dark:bg-background-dark overflow-y-auto px-6 py-8 scrollbar-hide">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-800 text-background-dark dark:text-white">
              Venues Near You{" "}
              <span className="text-sm font-normal text-slate-500 ml-2">({venues.length} found)</span>
            </h2>
            <div className="flex items-center gap-2 text-sm font-semibold text-background-dark/60 dark:text-slate-400">
              Sort by:
              <select className="bg-transparent border-none p-0 pr-6 text-sm font-bold text-primary focus:ring-0 cursor-pointer">
                <option>Distance</option>
                <option>Rating</option>
                <option>Price</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {venues.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">No venues found</p>
              </div>
            ) : (
              venues.map((venue) => (
                <VenueCard key={venue.id} {...venue} />
              ))
            )}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
