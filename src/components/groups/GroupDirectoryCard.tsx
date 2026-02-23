"use client";

import Link from "next/link";

interface GroupDirectoryCardProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  playerCount: number;
  location: string;
  skillLevel: string;
  type: "competitive" | "social" | "corporate";
  imageUrl: string;
  isJoinable: boolean;
  liveMatches?: number;
}

export function GroupDirectoryCard({
  id,
  slug,
  name,
  description,
  playerCount,
  location,
  skillLevel,
  type,
  imageUrl,
  isJoinable,
  liveMatches,
}: GroupDirectoryCardProps) {
  const typeColors = {
    competitive: "bg-primary text-background-dark",
    social: "bg-blue-500 text-white",
    corporate: "bg-orange-500 text-white",
  };

  const skillLabels = {
    beginner: "Beginner Friendly",
    intermediate: "Intermediate",
    advanced: "Advanced",
    professional: "Pro/Elite",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group border-b-4 border-b-transparent hover:border-b-primary">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 bg-primary text-background-dark text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
          {type}
        </div>
        {liveMatches && liveMatches > 0 && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {liveMatches} matches live
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-background-dark dark:text-white text-xl font-bold">
            {name}
          </h3>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
            {skillLabels[skillLevel as keyof typeof skillLabels] || skillLevel}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm mb-6">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">group</span>
            {playerCount} Players
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">location_on</span>
            {location}
          </div>
        </div>

        <Link href={`/groups/${slug}/join`}>
          <button className="w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2">
            Join Group
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
