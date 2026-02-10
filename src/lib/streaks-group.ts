import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlayerStreaks } from "@/lib/streaks";

const getSupabaseServerClient = async () => createSupabaseServerClient();

type Row = {
  player_id: string;
  is_win: boolean;
  played_at: string;
  match_id: string;
};

/**
 * Fetch streaks for *all* players in a group in one query to avoid N+1 loading.
 */
export async function getGroupPlayerStreaks(groupId: string): Promise<Record<string, PlayerStreaks>> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from("v_player_match_results_enriched")
    .select("player_id, is_win, played_at, match_id")
    .eq("group_id", groupId)
    .order("player_id", { ascending: true })
    .order("played_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return {};
  }

  const rows = data as unknown as Row[];

  const out: Record<string, PlayerStreaks> = {};

  // Streaming scan per player
  let currentPlayerId: string | null = null;
  let currentType: "win" | "loss" | null = null;
  let currentCount = 0;
  let longestWin = 0;
  let longestLoss = 0;

  function finalizePlayer(playerId: string | null, lastWasWin: boolean | null) {
    if (!playerId) return;

    if (currentType === "win") longestWin = Math.max(longestWin, currentCount);
    if (currentType === "loss") longestLoss = Math.max(longestLoss, currentCount);

    const currentStreak =
      lastWasWin === null
        ? 0
        : lastWasWin
          ? currentCount
          : -currentCount;

    out[playerId] = {
      currentStreak,
      longestWinStreak: longestWin,
      longestLossStreak: longestLoss,
      // not needed for the directory badge; keep empty to minimize payload
      streakHistory: [],
    };
  }

  let lastWasWin: boolean | null = null;

  for (const row of rows) {
    if (row.player_id !== currentPlayerId) {
      finalizePlayer(currentPlayerId, lastWasWin);

      // reset state for new player
      currentPlayerId = row.player_id;
      currentType = null;
      currentCount = 0;
      longestWin = 0;
      longestLoss = 0;
      lastWasWin = null;
    }

    const isWin = Boolean(row.is_win);
    lastWasWin = isWin;

    if (currentType === null) {
      currentType = isWin ? "win" : "loss";
      currentCount = 1;
      continue;
    }

    const sameType = (currentType === "win" && isWin) || (currentType === "loss" && !isWin);
    if (sameType) {
      currentCount += 1;
      continue;
    }

    // type changed -> close previous streak
    if (currentType === "win") longestWin = Math.max(longestWin, currentCount);
    if (currentType === "loss") longestLoss = Math.max(longestLoss, currentCount);

    currentType = isWin ? "win" : "loss";
    currentCount = 1;
  }

  finalizePlayer(currentPlayerId, lastWasWin);

  return out;
}
