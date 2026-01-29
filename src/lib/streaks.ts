import { createSupabaseServerClient } from "@/lib/supabase/server";

const getSupabaseServerClient = async () => createSupabaseServerClient();

export type StreakHistoryItem = {
  streak: number;
  type: "win" | "loss";
  startMatchId: string;
  endMatchId: string;
  startDate: string;
  endDate: string;
};

export type PlayerStreaks = {
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  streakHistory: StreakHistoryItem[];
};

export async function getPlayerStreaks(
  groupId: string,
  playerId: string
): Promise<PlayerStreaks> {
  const supabaseServer = await getSupabaseServerClient();

  const { data: matchResults, error } = await supabaseServer
    .from("v_player_match_results_enriched")
    .select("match_id, is_win, played_at")
    .eq("player_id", playerId)
    .eq("group_id", groupId)
    .order("played_at", { ascending: true });

  if (error || !matchResults || matchResults.length === 0) {
    return { currentStreak: 0, longestWinStreak: 0, longestLossStreak: 0, streakHistory: [] };
  }

  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  const streakHistory: StreakHistoryItem[] = [];

  let currentStreakType: "win" | "loss" | null = null;
  let currentStreakCount = 0;
  let streakStartMatchId = "";
  let streakStartDate = "";

  for (let i = 0; i < matchResults.length; i++) {
    const match = matchResults[i];
    const isWin = match.is_win;

    if (currentStreakType === null) {
      currentStreakType = isWin ? "win" : "loss";
      currentStreakCount = 1;
      streakStartMatchId = match.match_id;
      streakStartDate = match.played_at;
    } else if ((currentStreakType === "win" && isWin) || (currentStreakType === "loss" && !isWin)) {
      currentStreakCount++;
    } else {
      streakHistory.push({
        streak: currentStreakCount,
        type: currentStreakType,
        startMatchId: streakStartMatchId,
        endMatchId: matchResults[i - 1].match_id,
        startDate: streakStartDate,
        endDate: matchResults[i - 1].played_at,
      });

      if (currentStreakType === "win") {
        longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
      } else {
        longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
      }

      currentStreakType = isWin ? "win" : "loss";
      currentStreakCount = 1;
      streakStartMatchId = match.match_id;
      streakStartDate = match.played_at;
    }
  }

  if (currentStreakType !== null && currentStreakCount > 0) {
    streakHistory.push({
      streak: currentStreakCount,
      type: currentStreakType,
      startMatchId: streakStartMatchId,
      endMatchId: matchResults[matchResults.length - 1].match_id,
      startDate: streakStartDate,
      endDate: matchResults[matchResults.length - 1].played_at,
    });

    if (currentStreakType === "win") {
      longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
    } else {
      longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
    }
  }

  const lastMatch = matchResults[matchResults.length - 1];
  currentStreak = lastMatch.is_win ? currentStreakCount : -currentStreakCount;

  return { currentStreak, longestWinStreak, longestLossStreak, streakHistory };
}
