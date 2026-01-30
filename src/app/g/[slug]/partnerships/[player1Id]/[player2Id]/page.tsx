"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PartnershipDetail } from "@/lib/partnership-types";

interface PartnershipDetailPageProps {
  params: Promise<{ slug: string; player1Id: string; player2Id: string }>;
}

export default function PartnershipDetailPage({
  params,
}: PartnershipDetailPageProps) {
  const [data, setData] = useState<PartnershipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setPlayer1Id(p.player1Id);
      setPlayer2Id(p.player2Id);
    });
  }, [params]);

  useEffect(() => {
    if (!player1Id || !player2Id) return;

    async function fetchPartnership() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/partnerships/${player1Id}/${player2Id}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Partnership not found or insufficient match data");
            return;
          }
          throw new Error("Failed to fetch partnership details");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPartnership();
  }, [player1Id, player2Id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href={slug ? `/g/${slug}/partnerships` : "/"}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Partnerships
        </Link>

        <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-xl">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link
            href={slug ? `/g/${slug}/partnerships` : "/"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Partnerships
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { player1, player2, partnership, match_history } = data;
  const winRatePercent = Math.round(partnership.win_rate * 100);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back link */}
      <Link
        href={`/g/${slug}/partnerships`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Partnerships
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto">
              {player1.name.charAt(0)}
            </div>
            <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
              {player1.name}
            </p>
          </div>

          <div className="text-4xl font-bold text-gray-300">&</div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto">
              {player2.name.charAt(0)}
            </div>
            <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
              {player2.name}
            </p>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Partnership Stats
        </h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {partnership.matches_played}
          </p>
          <p className="text-sm text-gray-500">Matches Played</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-3xl font-bold text-green-600">
            {winRatePercent}%
          </p>
          <p className="text-sm text-gray-500">Win Rate</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {partnership.wins}-{partnership.losses}
          </p>
          <p className="text-sm text-gray-500">W-L Record</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-800">
          <p className="text-3xl font-bold text-blue-600">
            {partnership.synergy_score.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Synergy Score</p>
        </div>
      </div>

      {/* Match History */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Match History
        </h2>

        {match_history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No match history available
          </p>
        ) : (
          <div className="space-y-4">
            {match_history.map((match, index) => (
              <div
                key={match.match_id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  match.result === "win"
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-red-50 dark:bg-red-900/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      match.result === "win"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {match.result === "win" ? "W" : "L"}
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      vs{" "}
                      {match.opponent_team_players
                        ?.map((p) => p.name)
                        .join(" & ") || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(match.played_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {match.score_summary}
                  </p>
                  <p className="text-sm text-gray-500">
                    {match.result === "win" ? "+" : ""}
                    {match.elo_change_player1.toFixed(1)} / {" "}
                    {match.result === "win" ? "+" : ""}
                    {match.elo_change_player2.toFixed(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
