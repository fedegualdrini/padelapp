// ============================================================================
// Racket Performance Tracker Data Layer
// ============================================================================

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Racket,
  RacketInput,
  RacketUpdateInput,
  MatchRacket,
  RacketStats,
  RacketPerformanceOverTime,
  RacketComparison,
  PlayerRacketInsight,
  RacketWithStats,
} from "./racket-types";

const getSupabaseServerClient = async () => createSupabaseServerClient();

// ============================================================================
// CRUD Operations for Rackets
// ============================================================================

/**
 * Get all rackets for a player
 */
export const getPlayerRackets = cache(async (playerId: string): Promise<Racket[]> => {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("rackets")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Racket[];
});

/**
 * Get a single racket by ID
 */
export const getRacketById = cache(async (racketId: string): Promise<Racket | null> => {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("rackets")
    .select("*")
    .eq("id", racketId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Racket;
});

/**
 * Create a new racket
 */
export async function createRacket(playerId: string, racket: RacketInput): Promise<Racket | null> {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("rackets")
    .insert({
      player_id: playerId,
      brand: racket.brand,
      model: racket.model,
      weight: racket.weight || null,
      balance: racket.balance || null,
      purchase_date: racket.purchase_date || null,
      is_active: racket.is_active ?? true,
    })
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data as Racket;
}

/**
 * Update an existing racket
 */
export async function updateRacket(racket: RacketUpdateInput): Promise<Racket | null> {
  const supabaseServer = await getSupabaseServerClient();
  const updateData: {
    brand?: string;
    model?: string;
    weight?: number | null;
    balance?: number | null;
    purchase_date?: string | null;
    is_active?: boolean;
  } = {};

  if (racket.brand !== undefined) {
    updateData.brand = racket.brand;
  }
  if (racket.model !== undefined) {
    updateData.model = racket.model;
  }
  if (racket.weight !== undefined) {
    updateData.weight = racket.weight;
  }
  if (racket.balance !== undefined) {
    updateData.balance = racket.balance;
  }
  if (racket.purchase_date !== undefined) {
    updateData.purchase_date = racket.purchase_date;
  }
  if (racket.is_active !== undefined) {
    updateData.is_active = racket.is_active;
  }

  const { data, error } = await supabaseServer
    .from("rackets")
    .update(updateData)
    .eq("id", racket.id)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data as Racket;
}

/**
 * Delete a racket
 */
export async function deleteRacket(racketId: string): Promise<boolean> {
  const supabaseServer = await getSupabaseServerClient();
  const { error } = await supabaseServer
    .from("rackets")
    .delete()
    .eq("id", racketId);

  if (error) {
    return false;
  }

  return true;
}

// ============================================================================
// Match Racket Operations
// ============================================================================

/**
 * Get rackets used in a match
 */
export const getMatchRackets = cache(async (matchId: string): Promise<MatchRacket[]> => {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("match_rackets")
    .select("*")
    .eq("match_id", matchId);

  if (error || !data) {
    return [];
  }

  return data as MatchRacket[];
});

/**
 * Set or update racket for a player in a match
 */
export async function setMatchRacket(
  matchId: string,
  playerId: string,
  racketId: string | null
): Promise<MatchRacket | null> {
  const supabaseServer = await getSupabaseServerClient();

  // Check if record exists
  const { data: existing } = await supabaseServer
    .from("match_rackets")
    .select("*")
    .eq("match_id", matchId)
    .eq("player_id", playerId)
    .single();

  if (existing) {
    // Update existing record
    const { data, error } = await supabaseServer
      .from("match_rackets")
      .update({ racket_id: racketId })
      .eq("id", existing.id)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return data as MatchRacket;
  } else {
    // Create new record
    const { data, error } = await supabaseServer
      .from("match_rackets")
      .insert({
        match_id: matchId,
        player_id: playerId,
        racket_id: racketId,
      })
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return data as MatchRacket;
  }
}

/**
 * Batch set rackets for all players in a match
 */
export async function setMatchRackets(
  matchId: string,
  playerRackets: { playerId: string; racketId: string | null }[]
): Promise<boolean> {
  const results = await Promise.all(
    playerRackets.map(({ playerId, racketId }) =>
      setMatchRacket(matchId, playerId, racketId)
    )
  );

  return results.every((result) => result !== null);
}

// ============================================================================
// Statistics and Analytics
// ============================================================================

/**
 * Get racket statistics
 */
export const getRacketStats = cache(
  async (racketId: string, groupId: string): Promise<RacketStats | null> => {
    const supabaseServer = await getSupabaseServerClient();
    const { data, error } = await supabaseServer.rpc("get_racket_stats", {
      p_racket_id: racketId,
      p_group_id: groupId,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0] as RacketStats;
  }
);

/**
 * Get racket with stats
 */
export const getRacketWithStats = cache(
  async (racketId: string, groupId: string): Promise<RacketWithStats | null> => {
    const racket = await getRacketById(racketId);
    if (!racket) {
      return null;
    }

    const stats = await getRacketStats(racketId, groupId);

    return {
      ...racket,
      stats,
    };
  }
);

/**
 * Get racket performance over time
 */
export const getRacketPerformanceOverTime = cache(
  async (racketId: string, groupId: string): Promise<RacketPerformanceOverTime[]> => {
    const supabaseServer = await getSupabaseServerClient();
    const { data, error } = await supabaseServer.rpc("get_racket_performance_over_time", {
      p_racket_id: racketId,
      p_group_id: groupId,
    });

    if (error || !data) {
      return [];
    }

    return data as RacketPerformanceOverTime[];
  }
);

/**
 * Compare multiple rackets
 */
export const compareRackets = cache(
  async (playerId: string, groupId: string, racketIds: string[]): Promise<RacketComparison[]> => {
    const supabaseServer = await getSupabaseServerClient();
    const { data, error } = await supabaseServer.rpc("compare_rackets", {
      p_player_id: playerId,
      p_group_id: groupId,
      p_racket_ids: racketIds,
    });

    if (error || !data) {
      return [];
    }

    return data as RacketComparison[];
  }
);

/**
 * Get player racket insights
 */
export const getPlayerRacketInsights = cache(
  async (playerId: string, groupId: string): Promise<PlayerRacketInsight[]> => {
    const supabaseServer = await getSupabaseServerClient();
    const { data, error } = await supabaseServer.rpc("get_player_racket_insights", {
      p_player_id: playerId,
      p_group_id: groupId,
    });

    if (error || !data) {
      return [];
    }

    return data as PlayerRacketInsight[];
  }
);

/**
 * Get all player rackets with stats
 */
export const getPlayerRacketsWithStats = cache(
  async (playerId: string, groupId: string): Promise<RacketWithStats[]> => {
    const rackets = await getPlayerRackets(playerId);
    const racketsWithStats = await Promise.all(
      rackets.map(async (racket) => {
        const stats = await getRacketStats(racket.id, groupId);
        return {
          ...racket,
          stats,
        };
      })
    );

    return racketsWithStats;
  }
);
