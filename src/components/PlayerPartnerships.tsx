"use client";

import { useEffect, useState } from "react";
import PartnershipCard from "./PartnershipCard";
import type { PlayerPartnershipsResponse } from "@/lib/partnership-types";

interface PlayerPartnershipsProps {
  playerId: string;
  groupSlug: string;
  playerName: string;
}

export default function PlayerPartnerships({
  playerId,
  groupSlug,
  playerName,
}: PlayerPartnershipsProps) {
  const [data, setData] = useState<PlayerPartnershipsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPartnerships() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/partnerships/${playerId}/best-partners`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setData(null);
            return;
          }
          throw new Error("Failed to fetch partnerships");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPartnerships();
  }, [playerId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        <p className="text-sm">Failed to load partnerships: {error}</p>
      </div>
    );
  }

  if (!data || (data.best_partners.length === 0 && data.worst_partners.length === 0)) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm">
          {playerName} needs at least 3 matches with a partner to show partnership stats.
        </p>
        <a
          href={`/g/${groupSlug}/partnerships`}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          View all partnerships →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Great Chemistry Section */}
      {data.best_partners.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔥</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Great Chemistry
            </h4>
            <span className="text-xs text-gray-500">
              ({data.best_partners.length} partnership{data.best_partners.length !== 1 ? "s" : ""})
            </span>
          </div>
          <div className="space-y-3">
            {data.best_partners.map((partnership) => (
              <PartnershipCard
                key={`${partnership.player1_id}-${partnership.player2_id}`}
                partnership={partnership}
                groupSlug={groupSlug}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Room for Improvement Section */}
      {data.worst_partners.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📉</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Room for Improvement
            </h4>
            <span className="text-xs text-gray-500">
              ({data.worst_partners.length} partnership{data.worst_partners.length !== 1 ? "s" : ""})
            </span>
          </div>
          <div className="space-y-3">
            {data.worst_partners.map((partnership) => (
              <PartnershipCard
                key={`${partnership.player1_id}-${partnership.player2_id}`}
                partnership={partnership}
                groupSlug={groupSlug}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* View All Link */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href={`/g/${groupSlug}/partnerships?player_id=${playerId}`}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all {playerName}&apos;s partnerships →
        </a>
      </div>
    </div>
  );
}
