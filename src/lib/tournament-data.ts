import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Tournament,
  TournamentParticipant,
  TournamentRound,
  TournamentMatch,
  TournamentStanding,
  TournamentDetail,
  CreateTournamentInput,
  UpdateTournamentStatusInput,
  AddParticipantInput,
  UpdateMatchScoreInput,
} from "./tournament-types";
import { validateCreateTournamentInput, generateAmericanoSchedule } from "./tournament-types";

const getSupabaseServerClient = async () => createSupabaseServerClient();

// Type definitions for Supabase query results
interface SupabaseParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  seed_position?: number;
  players?: { name: string } | null;
}

interface SupabaseStanding {
  id: string;
  tournament_id: string;
  player_id: string;
  points: number;
  wins: number;
  losses: number;
  rank?: number;
  players?: { name: string } | null;
}

interface SupabaseMatchTeamPlayer {
  player_id: string;
  players?: { name: string } | null;
}

interface SupabaseMatchTeam {
  team_number: number;
  match_team_players: SupabaseMatchTeamPlayer[];
}

interface SupabaseSetScore {
  team1_games: number;
  team2_games: number;
}

interface SupabaseSet {
  set_number: number;
  set_scores: SupabaseSetScore | null;
}

interface SupabaseMatchData {
  played_at?: string;
  match_teams: SupabaseMatchTeam[];
  sets: SupabaseSet[];
}

interface SupabaseTournamentMatch {
  id: string;
  tournament_id: string;
  round_id: string;
  match_id: string;
  court_number: number;
  status: string;
  matches: SupabaseMatchData | null;
}

interface SupabaseRound {
  id: string;
  round_number: number;
}

// Get all tournaments for a group
export async function getTournamentsByGroupId(groupId: string): Promise<Tournament[]> {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("tournaments")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getTournamentsByGroupId error:", error);
    return [];
  }

  return data as Tournament[];
}

// Get tournament by ID with all related data
export const getTournamentById = cache(async (tournamentId: string): Promise<TournamentDetail | null> => {
  const supabaseServer = await getSupabaseServerClient();

  // Get tournament
  const { data: tournament, error: tournamentError } = await supabaseServer
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) {
    console.error("getTournamentById error:", tournamentError);
    return null;
  }

  // Get participants with player names
  const { data: participants, error: participantsError } = await supabaseServer
    .from("tournament_participants")
    .select(`
      *,
      players:player_id (name)
    `)
    .eq("tournament_id", tournamentId);

  if (participantsError) {
    console.error("getTournamentById participants error:", participantsError);
  }

  // Get rounds
  const { data: rounds, error: roundsError } = await supabaseServer
    .from("tournament_rounds")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round_number", { ascending: true });

  if (roundsError) {
    console.error("getTournamentById rounds error:", roundsError);
  }

  // Get matches with full match details
  const { data: matches, error: matchesError } = await supabaseServer
    .from("tournament_matches")
    .select(`
      *,
      matches:match_id (
        played_at,
        match_teams:match_teams (
          team_number,
          match_team_players:match_team_players (
            player_id,
            players:player_id (name)
          )
        ),
        sets:sets (
          set_number,
          set_scores:set_scores (team1_games, team2_games)
        )
      )
    `)
    .eq("tournament_id", tournamentId)
    .order("round_id", { ascending: true });

  if (matchesError) {
    console.error("getTournamentById matches error:", matchesError);
  }

  // Get standings with player names
  const { data: standings, error: standingsError } = await supabaseServer
    .from("tournament_standings")
    .select(`
      *,
      players:player_id (name)
    `)
    .eq("tournament_id", tournamentId)
    .order("rank", { ascending: true });

  if (standingsError) {
    console.error("getTournamentById standings error:", standingsError);
  }

  // Transform participants with names
  const transformedParticipants: TournamentParticipant[] = (participants || []).map((p: SupabaseParticipant) => ({
    id: p.id,
    tournament_id: p.tournament_id,
    player_id: p.player_id,
    player_name: p.players?.name,
    seed_position: p.seed_position,
  }));

  // Transform matches with full details
  const transformedMatches: TournamentMatch[] = (matches || []).map((m: SupabaseTournamentMatch) => {
    const matchData = m.matches;
    const teams = matchData?.match_teams || [];
    const team1 = teams.find((t: SupabaseMatchTeam) => t.team_number === 1);
    const team2 = teams.find((t: SupabaseMatchTeam) => t.team_number === 2);

    // Calculate scores from sets
    let team1Score = 0;
    let team2Score = 0;
    const sets = matchData?.sets || [];
    sets.forEach((set: SupabaseSet) => {
      const scores = set.set_scores;
      if (scores) {
        if (scores.team1_games > scores.team2_games) team1Score++;
        else if (scores.team2_games > scores.team1_games) team2Score++;
      }
    });

    return {
      id: m.id,
      tournament_id: m.tournament_id,
      round_id: m.round_id,
      round_number: rounds?.find((r: SupabaseRound) => r.id === m.round_id)?.round_number ?? 0,
      match_id: m.match_id,
      court_number: m.court_number,
      status: m.status as "scheduled" | "in_progress" | "completed",
      played_at: matchData?.played_at,
      team1_players: team1?.match_team_players?.map((p: SupabaseMatchTeamPlayer) => ({
        id: p.player_id,
        name: p.players?.name ?? "",
      })) || [],
      team2_players: team2?.match_team_players?.map((p: SupabaseMatchTeamPlayer) => ({
        id: p.player_id,
        name: p.players?.name ?? "",
      })) || [],
      team1_score: team1Score,
      team2_score: team2Score,
      winner_team: team1Score > team2Score ? 1 : team2Score > team1Score ? 2 : undefined,
    };
  });

  // Transform standings with names
  const transformedStandings: TournamentStanding[] = (standings || []).map((s: SupabaseStanding) => ({
    id: s.id,
    tournament_id: s.tournament_id,
    player_id: s.player_id,
    player_name: s.players?.name,
    points: s.points,
    wins: s.wins,
    losses: s.losses,
    rank: s.rank,
  }));

  return {
    tournament: tournament as Tournament,
    participants: transformedParticipants,
    rounds: (rounds || []) as TournamentRound[],
    matches: transformedMatches,
    standings: transformedStandings,
  };
});

// Create tournament (uses RPC)
export async function createTournament(
  input: CreateTournamentInput
): Promise<{ success: boolean; tournament?: Tournament; error?: string }> {
  const validation = validateCreateTournamentInput(input);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(", ") };
  }

  const supabaseServer = await getSupabaseServerClient();

  // Call the RPC function
  const { data, error } = await supabaseServer.rpc("create_tournament", {
    p_group_id: input.group_id,
    p_name: input.name,
    p_format: input.format,
    p_start_date: input.start_date,
    p_scoring_system: input.scoring_system,
    p_court_count: input.court_count,
    p_participant_ids: input.participant_ids,
  });

  if (error) {
    console.error("createTournament error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, tournament: data as Tournament };
}

// Update tournament status
export async function updateTournamentStatus(
  input: UpdateTournamentStatusInput
): Promise<{ success: boolean; error?: string }> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer.rpc("update_tournament_status", {
    p_tournament_id: input.tournament_id,
    p_status: input.status,
  });

  if (error) {
    console.error("updateTournamentStatus error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Add participant to tournament
export async function addTournamentParticipant(
  input: AddParticipantInput
): Promise<{ success: boolean; error?: string }> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer.rpc("add_tournament_participant", {
    p_tournament_id: input.tournament_id,
    p_player_id: input.player_id,
    p_seed_position: input.seed_position,
  });

  if (error) {
    console.error("addTournamentParticipant error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Update match score
export async function updateTournamentMatchScore(
  input: UpdateMatchScoreInput
): Promise<{ success: boolean; error?: string }> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer.rpc("update_match_score", {
    p_tournament_match_id: input.tournament_match_id,
    p_team1_games: input.team1_games,
    p_team2_games: input.team2_games,
  });

  if (error) {
    console.error("updateTournamentMatchScore error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Get players available for tournament (group members not already participating)
export async function getAvailablePlayers(
  groupId: string,
  tournamentId: string
): Promise<{ id: string; name: string }[]> {
  const supabaseServer = await getSupabaseServerClient();

  // Get all players in group
  const { data: allPlayers, error: playersError } = await supabaseServer
    .from("players")
    .select("id, name")
    .eq("group_id", groupId);

  if (playersError || !allPlayers) {
    console.error("getAvailablePlayers error:", playersError);
    return [];
  }

  // Get existing participants
  const { data: participants, error: participantsError } = await supabaseServer
    .from("tournament_participants")
    .select("player_id")
    .eq("tournament_id", tournamentId);

  if (participantsError) {
    console.error("getAvailablePlayers participants error:", participantsError);
  }

  const participantIds = new Set((participants || []).map((p) => p.player_id));

  // Filter out existing participants
  return allPlayers.filter((p) => !participantIds.has(p.id));
}

// Export utility functions
export { validateCreateTournamentInput, generateAmericanoSchedule };
