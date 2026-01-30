"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PartnershipCard from "@/components/PartnershipCard";
import type { Partnership, PartnershipsResponse } from "@/lib/partnership-types";

interface PartnershipsPageProps {
  params: Promise<{ slug: string }>;
}

export default function PartnershipsPage({ params }: PartnershipsPageProps) {
  const [slug, setSlug] = useState<string>("");
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter/sort state
  const [minMatches, setMinMatches] = useState(3);
  const [sortBy, setSortBy] = useState("win_rate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [playerFilter, setPlayerFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const searchParams = useSearchParams();

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    // Check for player_id in URL
    const playerIdFromUrl = searchParams.get("player_id");
    if (playerIdFromUrl) {
      setPlayerFilter(playerIdFromUrl);
    }
  }, [searchParams]);

  const fetchPartnerships = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        min_matches: minMatches.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (playerFilter) {
        queryParams.set("player_id", playerFilter);
      }

      const response = await fetch(`/api/partnerships?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch partnerships");
      }

      const result: PartnershipsResponse = await response.json();
      setPartnerships(result.partnerships);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [slug, minMatches, sortBy, sortOrder, playerFilter, offset]);

  useEffect(() => {
    fetchPartnerships();
  }, [fetchPartnerships]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setOffset(0);
  };

  const handleResetFilters = () => {
    setMinMatches(3);
    setSortBy("win_rate");
    setSortOrder("desc");
    setPlayerFilter("");
    setOffset(0);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (!slug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Partnership Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover which player pairs have the best chemistry on the court
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Min Matches:
            </label>
            <select
              value={minMatches}
              onChange={(e) => {
                setMinMatches(parseInt(e.target.value));
                setOffset(0);
              }}
              className="text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
            >
              <option value={3}>3+</option>
              <option value={5}>5+</option>
              <option value={10}>10+</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setOffset(0);
              }}
              className="text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 bg-white dark:bg-gray-800"
            >
              <option value="win_rate">Win Rate</option>
              <option value="matches_played">Matches Played</option>
              <option value="elo_change_delta">ELO Delta</option>
              <option value="last_played_together">Last Played</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {sortOrder === "desc" ? "↓ Descending" : "↑ Ascending"}
          </button>

          <button
            onClick={handleResetFilters}
            className="text-sm px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>

        {playerFilter && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Filtering by player ID: {playerFilter}
              <button
                onClick={() => {
                  setPlayerFilter("");
                  setOffset(0);
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800"
            >
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPartnerships}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : partnerships.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No partnerships found with the current filters.
          </p>
          <p className="text-sm text-gray-500">
            Try reducing the minimum matches requirement or removing filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerships.map((partnership) => (
              <PartnershipCard
                key={`${partnership.player1_id}-${partnership.player2_id}`}
                partnership={partnership}
                groupSlug={slug}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
                <span className="mx-2">•</span>
                {total} partnerships
              </span>

              <button
                onClick={() => setOffset(Math.min((totalPages - 1) * limit, offset + limit))}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
