import { notFound } from "next/navigation";
import { Trophy, TrendingUp, Share2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Metadata } from "next";

// This route is public, accessible without login
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicRankingPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type RankingData = {
  group_id: string;
  group_name: string;
  group_slug: string;
  player_id: string;
  player_name: string;
  player_status: "usual" | "invite";
  current_elo: number;
  matches_played: number;
  elo_change: number;
};

// Generate OG meta tags
export async function generateMetadata(
  { params }: PublicRankingPageProps
): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.rpc("get_public_ranking_by_token", {
    p_token: token,
  });

  if (!data || (data as RankingData[]).length === 0) {
    return {
      title: "Ranking - Padelapp",
      description: "View ELO rankings and player stats",
    };
  }

  const rankings = data as RankingData[];
  const group = rankings[0];
  const topPlayer = rankings[0];

  return {
    title: `${group.group_name} - Ranking | Padelapp`,
    description: `View ELO rankings for ${group.group_name}. ${topPlayer.player_name} leads with ${topPlayer.current_elo} ELO points.`,
    openGraph: {
      title: `${group.group_name} - Ranking`,
      description: `View ELO rankings for ${group.group_name}. ${topPlayer.player_name} leads with ${topPlayer.current_elo} ELO points.`,
      type: "website",
      images: [
        {
          url: `/api/og/ranking/${token}`,
          width: 1200,
          height: 630,
          alt: `${group.group_name} Ranking`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${group.group_name} - Ranking`,
      description: `View ELO rankings for ${group.group_name}. ${topPlayer.player_name} leads with ${topPlayer.current_elo} ELO points.`,
      images: [`/api/og/ranking/${token}`],
    },
  };
}

function getRankChangeColor(change: number): string {
  if (change > 0) return "text-green-600";
  if (change < 0) return "text-red-600";
  return "text-gray-500";
}

function getRankChangeIcon(change: number) {
  if (change > 0) return "↑";
  if (change < 0) return "↓";
  return "-";
}

export default async function PublicRankingPage({
  params,
}: PublicRankingPageProps) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_public_ranking_by_token", {
    p_token: token,
  });

  if (error || !data) {
    notFound();
  }

  const rankings = data as RankingData[];
  if (rankings.length === 0) {
    notFound();
  }

  const group = rankings[0];
  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/rank/public/${token}`;

  // Get player colors from existing logic or generate them
  const colors = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  ];

  const playersWithColors = rankings.map((r, i) => ({
    ...r,
    color: colors[i % colors.length],
  }));

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${group.group_name} - Ranking`,
          text: `Check out the ELO rankings for ${group.group_name}!`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {group.group_name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ELO Rankings
                </p>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 transition-all hover:shadow-md"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Players
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {rankings.length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Top ELO
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {rankings[0]?.current_elo || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Matches
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(
                  rankings.reduce((sum, r) => sum + r.matches_played, 0) /
                    rankings.length
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Leaderboard
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {playersWithColors.map((player, index) => {
              const isTop3 = index < 3;
              const rankBadgeColor = index === 0
                ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                : index === 1
                ? "bg-gradient-to-br from-gray-300 to-gray-500"
                : index === 2
                ? "bg-gradient-to-br from-orange-400 to-orange-600"
                : "bg-gray-200 dark:bg-slate-700";

              return (
                <div
                  key={player.player_id}
                  className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    isTop3 ? "bg-gradient-to-r from-transparent via-gray-50/50 dark:via-slate-700/30 to-transparent" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${rankBadgeColor}`}>
                      {index + 1}
                    </div>

                    {/* Player Color & Name */}
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {player.player_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {player.matches_played} matches played
                        </p>
                      </div>
                    </div>

                    {/* ELO & Change */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {player.current_elo}
                      </p>
                      {player.elo_change !== 0 && (
                        <p
                          className={`text-sm font-medium ${getRankChangeColor(
                            player.elo_change
                          )}`}
                        >
                          {getRankChangeIcon(player.elo_change)}{" "}
                          {Math.abs(player.elo_change)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by{" "}
            <a
              href="https://padelapp.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Padelapp
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
