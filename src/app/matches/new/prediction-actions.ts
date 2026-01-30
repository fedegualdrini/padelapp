"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PredictionFactor = {
  name: string;
  value: string;
  weight: string;
  impact: "team1" | "team2" | "neutral";
};

export type PredictionFactors = {
  teamAWinProb: number;
  teamBWinProb: number;
  factors: PredictionFactor[];
  confidenceLevel: "high" | "medium" | "low";
};

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

export async function getRecentForm(groupId: string, playerIds: string[], matchCount: number = 5): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { data: playerMatches } = await supabase
    .from("v_player_match_results")
    .select("is_win")
    .in("player_id", playerIds)
    .order("match_id", { ascending: false })
    .limit(playerIds.length * matchCount);

  if (!playerMatches || playerMatches.length === 0) return 0.5;

  const wins = playerMatches.filter((m) => m.is_win).length;
  return wins / playerMatches.length;
}

export async function getHeadToHead(
  groupId: string,
  team1PlayerIds: string[],
  team2PlayerIds: string[],
  beforeMatchId?: string
): Promise<number> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("matches")
    .select(`
      id,
      match_teams (
        team_number,
        match_team_players (
          player_id
        )
      )
    `)
    .eq("group_id", groupId)
    .order("played_at", { ascending: false })
    .limit(20);

  if (beforeMatchId) {
    const { data: matchData } = await supabase
      .from("matches")
      .select("played_at")
      .eq("id", beforeMatchId)
      .single();

    if (matchData) {
      query = query.lt("played_at", matchData.played_at);
    }
  }

  const { data: matches, error } = await query;

  if (error || !matches) return 0.5;

  let team1Wins = 0;
  let totalMatches = 0;

  for (const m of matches) {
    const t1 = m.match_teams?.find((t) => t.team_number === 1);
    const t2 = m.match_teams?.find((t) => t.team_number === 2);

    if (!t1 || !t2) continue;

    const t1Players = t1.match_team_players?.map((p) => p.player_id).filter(Boolean) || [];
    const t2Players = t2.match_team_players?.map((p) => p.player_id).filter(Boolean) || [];

    // Check if same teams (ignoring order)
    const team1SameAsT1 = team1PlayerIds.every((id) => t1Players.includes(id)) &&
                         team2PlayerIds.every((id) => t2Players.includes(id));
    const team1SameAsT2 = team1PlayerIds.every((id) => t2Players.includes(id)) &&
                         team2PlayerIds.every((id) => t1Players.includes(id));

    if (team1SameAsT1 || team1SameAsT2) {
      totalMatches++;

      // Check who won
      const { data: setWins } = await supabase
        .from("v_match_team_set_wins")
        .select("team_number, sets_won")
        .eq("match_id", m.id)
        .order("sets_won", { ascending: false })
        .limit(1);

      if (setWins && setWins.length > 0) {
        const winner = setWins[0].team_number;
        if ((team1SameAsT1 && winner === 1) || (team1SameAsT2 && winner === 2)) {
          team1Wins++;
        }
      }
    }
  }

  return totalMatches > 0 ? team1Wins / totalMatches : 0.5;
}

export async function getPartnershipSynergy(
  groupId: string,
  playerIds: string[]
): Promise<number> {
  if (playerIds.length !== 2) return 0.5;

  const supabase = await createSupabaseServerClient();

  const { data: pairStats } = await supabase
    .from("mv_pair_aggregates")
    .select("win_rate, matches_played")
    .or(`and(player_a_id.eq.${playerIds[0]},player_b_id.eq.${playerIds[1]}),and(player_a_id.eq.${playerIds[1]},player_b_id.eq.${playerIds[0]})`)
    .single();

  if (!pairStats || pairStats.matches_played < 3) return 0.5;
  return pairStats.win_rate;
}

export async function getCurrentStreak(groupId: string, playerIds: string[]): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { data: recentResults } = await supabase
    .from("v_player_match_results")
    .select("is_win")
    .in("player_id", playerIds)
    .order("match_id", { ascending: false })
    .limit(10);

  if (!recentResults || recentResults.length === 0) return 0;

  let streak = 0;
  const lastResult = recentResults[0].is_win;

  for (const result of recentResults) {
    if (result.is_win === lastResult) {
      streak += lastResult ? 1 : -1;
    } else {
      break;
    }
  }

  return streak;
}

export async function calculateMatchPrediction(
  groupId: string,
  team1PlayerIds: string[],
  team2PlayerIds: string[],
  beforeMatchId?: string
): Promise<PredictionFactors> {
  // Get ELO ratings
  const allPlayerIds = [...team1PlayerIds, ...team2PlayerIds];
  const eloRatings = await getPlayerElos(groupId, allPlayerIds);

  const getTeamAvgElo = (playerIds: string[]) => {
    const ratings = playerIds.map((id) => eloRatings[id] || 1000);
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  };

  const team1AvgElo = getTeamAvgElo(team1PlayerIds);
  const team2AvgElo = getTeamAvgElo(team2PlayerIds);
  const eloAdvantage = team1AvgElo - team2AvgElo;

  // Calculate base ELO probability
  const team1WinProb = 1 / (1 + Math.pow(10, (team2AvgElo - team1AvgElo) / 400));

  const factors: PredictionFactor[] = [];

  factors.push({
    name: "ELO advantage",
    value: `${eloAdvantage > 0 ? '+' : ''}${eloAdvantage}`,
    weight: `${Math.abs(eloAdvantage / 50).toFixed(0)}%`,
    impact: eloAdvantage > 0 ? "team1" : eloAdvantage < 0 ? "team2" : "neutral",
  });

  let adjustedProb = team1WinProb;

  // Fetch all factors in parallel
  const [team1Form, team2Form, headToHead, team1Synergy, team2Synergy, team1Streak, team2Streak] =
    await Promise.all([
      getRecentForm(groupId, team1PlayerIds, 5),
      getRecentForm(groupId, team2PlayerIds, 5),
      getHeadToHead(groupId, team1PlayerIds, team2PlayerIds, beforeMatchId),
      getPartnershipSynergy(groupId, team1PlayerIds),
      getPartnershipSynergy(groupId, team2PlayerIds),
      getCurrentStreak(groupId, team1PlayerIds),
      getCurrentStreak(groupId, team2PlayerIds),
    ]);

  // Apply form factor (±5% adjustment)
  const formAdvantage = (team1Form - team2Form) * 0.05;
  adjustedProb += formAdvantage;

  if (Math.abs(formAdvantage) > 0.01) {
    factors.push({
      name: "Recent form",
      value: `${formAdvantage > 0 ? '+' : ''}${(formAdvantage * 100).toFixed(0)}%`,
      weight: `±5%`,
      impact: formAdvantage > 0 ? "team1" : "team2",
    });
  }

  // Apply head-to-head factor (±10% adjustment)
  const h2hAdvantage = (headToHead - (1 - headToHead)) * 0.10;
  adjustedProb += h2hAdvantage;

  if (Math.abs(h2hAdvantage) > 0.01) {
    factors.push({
      name: "Head-to-head",
      value: `${h2hAdvantage > 0 ? '+' : ''}${(h2hAdvantage * 100).toFixed(0)}%`,
      weight: `±10%`,
      impact: h2hAdvantage > 0 ? "team1" : "team2",
    });
  }

  // Apply streak factor (±5% adjustment)
  const streakAdvantage = (Math.tanh(team1Streak / 3) - Math.tanh(team2Streak / 3)) * 0.05;
  adjustedProb += streakAdvantage;

  if (Math.abs(streakAdvantage) > 0.01) {
    factors.push({
      name: "Current streak",
      value: `${streakAdvantage > 0 ? '+' : ''}${(streakAdvantage * 100).toFixed(0)}%`,
      weight: `±5%`,
      impact: streakAdvantage > 0 ? "team1" : "team2",
    });
  }

  // Apply partnership synergy factor (±5% adjustment)
  const partnershipAdvantage = (team1Synergy - team2Synergy) * 0.05;
  adjustedProb += partnershipAdvantage;

  if (Math.abs(partnershipAdvantage) > 0.01) {
    factors.push({
      name: "Partner synergy",
      value: `${partnershipAdvantage > 0 ? '+' : ''}${(partnershipAdvantage * 100).toFixed(0)}%`,
      weight: `±5%`,
      impact: partnershipAdvantage > 0 ? "team1" : "team2",
    });
  }

  // Clamp to reasonable range [0.05, 0.95]
  adjustedProb = Math.max(0.05, Math.min(0.95, adjustedProb));

  // Determine confidence level
  const maxProb = Math.max(adjustedProb, 1 - adjustedProb);
  let confidenceLevel: "high" | "medium" | "low" = "medium";
  if (maxProb >= 0.70 && maxProb <= 0.85) confidenceLevel = "high";
  else if (maxProb < 0.55 || maxProb > 0.90) confidenceLevel = "low";

  return {
    teamAWinProb: adjustedProb,
    teamBWinProb: 1 - adjustedProb,
    factors,
    confidenceLevel,
  };
}
