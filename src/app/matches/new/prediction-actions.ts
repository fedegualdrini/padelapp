"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPlayerElos(
  groupId: string,
  playerIds: string[]
): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient();

  const { data: ratingsData, error } = await supabase
    .from("elo_ratings")
    .select("player_id, rating, created_at")
    .in("player_id", playerIds)
    .order("created_at", { ascending: false });

  if (error || !ratingsData) {
    // Return default ELO for all players
    return Object.fromEntries(playerIds.map((id) => [id, 1000]));
  }

  // Get latest ELO for each player
  const latestEloByPlayer: Record<string, number> = {};
  ratingsData.forEach((row) => {
    if (!(row.player_id in latestEloByPlayer)) {
      latestEloByPlayer[row.player_id] = row.rating;
    }
  });

  // Fill in default ELO for players without history
  playerIds.forEach((id) => {
    if (!(id in latestEloByPlayer)) {
      latestEloByPlayer[id] = 1000;
    }
  });

  return latestEloByPlayer;
}
