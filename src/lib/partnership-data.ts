// Partnership data queries using materialized view
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Partnership,
  PartnershipsResponse,
  PlayerPartnershipsResponse,
  PartnershipDetail,
  MatchHistoryItem,
  PartnershipsQueryParams,
} from "./partnership-types";
import {
  calculateSynergyScore,
  getPartnershipTier,
  getMatchesBadge,
  getEloDeltaIndicator,
} from "./partnership-types";

const getSupabaseServerClient = async () => createSupabaseServerClient();

// Type for query result with joined player data
type PartnershipQueryRow = Partnership & {
  player1?: { name: string } | null;
  player2?: { name: string } | null;
};

// Get partnerships list with filtering and sorting
export const getPartnerships = cache(
  async (params: PartnershipsQueryParams = {}): Promise<PartnershipsResponse> => {
    const supabaseServer = await getSupabaseServerClient();

    const {
      player_id,
      min_matches = 3,
      sort_by = "win_rate",
      sort_order = "desc",
      limit = 50,
      offset = 0,
    } = params;

    // Build base query - query partnerships and player names separately
    let query = supabaseServer
      .from("materialized_partnerships")
      .select(`*, player1:players!materialized_partnerships_player1_id_fkey(name), player2:players!materialized_partnerships_player2_id_fkey(name)`);

    // Apply filters
    if (player_id) {
      // Filter partnerships where player is either player1 or player2
      query = query.or(
        `player1_id.eq.${player_id},player2_id.eq.${player_id}`
      );
    }

    query = query.gte("matches_played", min_matches);

    // Apply sorting
    const validSortColumns = ["win_rate", "matches_played", "elo_change_delta", "last_played_together"];
    const orderColumn = validSortColumns.includes(sort_by) ? sort_by : "win_rate";
    query = query.order(orderColumn, { ascending: sort_order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching partnerships:", error);
      return { partnerships: [], total: 0 };
    }

    // Get total count for pagination
    let countQuery = supabaseServer
      .from("materialized_partnerships")
      .select("*", { count: "exact", head: true });

    if (player_id) {
      countQuery = countQuery.or(
        `player1_id.eq.${player_id},player2_id.eq.${player_id}`
      );
    }
    countQuery = countQuery.gte("matches_played", min_matches);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting partnerships:", countError);
    }

    // Transform data to include player names
    const partnerships: Partnership[] = (data || []).map((row: PartnershipQueryRow) => ({
      player1_id: row.player1_id,
      player2_id: row.player2_id,
      player1_name: row.player1?.name || "Unknown",
      player2_name: row.player2?.name || "Unknown",
      matches_played: row.matches_played,
      wins: row.wins,
      losses: row.losses,
      win_rate: row.win_rate,
      avg_elo_change_when_paired: row.avg_elo_change_when_paired,
      avg_individual_elo_change: row.avg_individual_elo_change,
      elo_change_delta: row.elo_change_delta,
      common_opponents_beaten: row.common_opponents_beaten,
      first_played_together: row.first_played_together,
      last_played_together: row.last_played_together,
      refreshed_at: row.refreshed_at,
    }));

    return {
      partnerships,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
    };
  }
);

// Get best and worst partners for a specific player
export const getPlayerBestPartners = cache(
  async (playerId: string): Promise<PlayerPartnershipsResponse | null> => {
    const supabaseServer = await getSupabaseServerClient();

    // Get player info
    const { data: playerData, error: playerError } = await supabaseServer
      .from("players")
      .select("name")
      .eq("id", playerId)
      .single();

    if (playerError || !playerData) {
      console.error("Error fetching player:", playerError);
      return null;
    }

    // Get all partnerships for this player (min 3 matches)
    const { data: partnerships, error } = await supabaseServer
      .from("materialized_partnerships")
      .select("*")
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
      .gte("matches_played", 3)
      .order("win_rate", { ascending: false });

    if (error) {
      console.error("Error fetching player partnerships:", error);
      return null;
    }

    // Transform and calculate synergy scores
    const transformedPartnerships = (partnerships || []).map((row: Partnership & { synergy_score?: number }) => {
      const partnerId = row.player1_id === playerId ? row.player2_id : row.player1_id;

      return {
        ...row,
        partner_id: partnerId,
        synergy_score: calculateSynergyScore(row),
      };
    });

    // Sort by synergy score
    transformedPartnerships.sort((a, b) => (b.synergy_score || 0) - (a.synergy_score || 0));

    const bestPartners = transformedPartnerships.slice(0, 3);
    const worstPartners = transformedPartnerships.slice(-3).reverse();

    return {
      player_id: playerId,
      player_name: playerData.name,
      best_partners: bestPartners,
      worst_partners: worstPartners,
      total_partnerships: transformedPartnerships.length,
    };
  }
);

// Get detailed partnership statistics and match history
export const getPartnershipDetail = cache(
  async (player1Id: string, player2Id: string): Promise<PartnershipDetail | null> => {
    const supabaseServer = await getSupabaseServerClient();

    // Get player info for both players
    const { data: playersData, error: playersError } = await supabaseServer
      .from("players")
      .select("id, name")
      .in("id", [player1Id, player2Id]);

    if (playersError || !playersData || playersData.length !== 2) {
      console.error("Error fetching players:", playersError);
      return null;
    }

    const player1 = playersData.find((p: { id: string; name: string }) => p.id === player1Id);
    const player2 = playersData.find((p: { id: string; name: string }) => p.id === player2Id);

    if (!player1 || !player2) {
      return null;
    }

    // Get partnership stats from materialized view
    const { data: partnershipData, error: partnershipError } = await supabaseServer
      .from("materialized_partnerships")
      .select("*")
      .eq("player1_id", player1Id)
      .eq("player2_id", player2Id)
      .single();

    if (partnershipError) {
      console.error("Error fetching partnership:", partnershipError);
      return null;
    }

    // Get match history with opponents
    const { data: matchHistory, error: historyError } = await supabaseServer.rpc(
      "get_partnership_match_history",
      {
        p_player1_id: player1Id,
        p_player2_id: player2Id,
      }
    );

    if (historyError) {
      console.error("Error fetching match history:", historyError);
    }

    const partnership = partnershipData || {
      matches_played: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      avg_elo_change_when_paired: 0,
      avg_individual_elo_change: 0,
      elo_change_delta: 0,
      first_played_together: null,
      last_played_together: null,
    };

    // Calculate synergy score
    const synergy_score = calculateSynergyScore(partnership);

    return {
      player1: { id: player1Id, name: player1.name, current_elo: 0 },
      player2: { id: player2Id, name: player2.name, current_elo: 0 },
      partnership: {
        matches_played: partnership.matches_played,
        wins: partnership.wins,
        losses: partnership.losses,
        win_rate: partnership.win_rate,
        avg_elo_change_when_paired: partnership.avg_elo_change_when_paired,
        avg_individual_elo_change: partnership.avg_individual_elo_change,
        elo_change_delta: partnership.elo_change_delta,
        first_played_together: partnership.first_played_together,
        last_played_together: partnership.last_played_together,
        synergy_score,
      },
      match_history: (matchHistory || []) as MatchHistoryItem[],
    };
  }
);

// Refresh partnerships materialized view (call before querying if stale)
export async function refreshPartnershipsIfStale(): Promise<void> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer.rpc("refresh_partnerships_if_stale");

  if (error) {
    console.error("Error refreshing partnerships:", error);
  }
}

// Re-export utility functions
export {
  calculateSynergyScore,
  getPartnershipTier,
  getMatchesBadge,
  getEloDeltaIndicator,
};
