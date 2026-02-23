import { GroupDirectoryCard } from "@/components/groups/GroupDirectoryCard";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getPublicGroups() {
  const supabase = await createSupabaseServerClient();

  const { data: groups, error } = await supabase
    .from("groups")
    .select(`
      id,
      name,
      slug,
      description,
      city,
      player_count,
      average_skill_level,
      is_public,
      is_joinable,
      cover_image_url,
      created_at
    `)
    .eq("is_public", true)
    .order("player_count", { ascending: false });

  if (error || !groups) {
    console.error("Error fetching groups:", error);
    return [];
  }

  return groups.map((group) => ({
    id: group.id,
    slug: group.slug || group.id,
    name: group.name,
    description: group.description || "",
    playerCount: group.player_count || 0,
    location: group.city || "Unknown",
    skillLevel: group.average_skill_level || undefined,
    type: "competitive" as const,
    imageUrl: group.cover_image_url || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
    isJoinable: group.is_joinable || false,
    liveMatches: 0, // TODO: Calculate from live matches
  }));
}

export default async function GroupsPage() {
  const groups = await getPublicGroups();

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
        {/* Page Header & Search */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-background-dark dark:text-white text-4xl font-black leading-tight tracking-tight">
                Groups Directory
              </h1>
              <p className="text-background-dark/60 dark:text-slate-400 text-lg mt-2">
                Connect with local padel squads and build your community.
              </p>
            </div>
            <Link href="/join">
              <button className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary/10 text-background-dark dark:text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-lg">grid_view</span>
                View My Groups
              </button>
            </Link>
          </div>

          {/* Filters Bar */}
          <div className="mt-8 p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[280px] relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search by group name or keyword..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-transparent hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-lg">location_on</span>
                Location: London
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-transparent hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-lg">trending_up</span>
                Level: Intermediate
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-transparent hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-lg">groups</span>
                Type: Competitive
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Group Grid */}
          <div className="flex-1">
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">No public groups found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {groups.map((group) => (
                  <GroupDirectoryCard key={group.id} {...group} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Suggested Groups */}
          <aside className="w-full lg:w-80 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-background-dark dark:text-white font-bold text-lg">
                  Suggested For You
                </h2>
                <span className="material-symbols-outlined text-slate-400">info</span>
              </div>

              <div className="space-y-6">
                {/* TODO: Implement suggested groups based on user location and preferences */}
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Sign in to see personalized group suggestions
                </p>
              </div>

              <button className="w-full mt-8 text-primary font-bold text-sm hover:underline">
                View All Near You
              </button>
            </div>

            {/* Promo Card */}
            <div className="bg-primary p-6 rounded-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-background-dark font-black text-xl leading-tight">
                  Host Your Own Group
                </h3>
                <p className="text-background-dark/80 text-sm mt-2 mb-4 font-medium">
                  Create a space for your corporate team or friends.
                </p>
                <Link href="/join">
                  <button className="bg-background-dark text-white text-xs font-bold px-4 py-2 rounded shadow-lg">
                    Get Started
                  </button>
                </Link>
              </div>
              <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-background-dark/10 text-9xl">
                sports_tennis
              </span>
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
