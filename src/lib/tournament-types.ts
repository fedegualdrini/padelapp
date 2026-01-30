// Tournament types for Social Tournament Manager feature

export type TournamentFormat = "americano" | "round_robin" | "bracket";
export type TournamentStatus = "upcoming" | "in_progress" | "completed";
export type ScoringSystem = "standard_21" | "custom";
export type TournamentMatchStatus = "scheduled" | "in_progress" | "completed";

// Main tournament entity
export interface Tournament {
  id: string;
  group_id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  start_date: string;
  scoring_system: ScoringSystem;
  court_count: number;
  created_at: string;
  created_by: string;
}

// Tournament participant
export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  player_id: string;
  player_name?: string;
  seed_position?: number;
}

// Tournament round
export interface TournamentRound {
  id: string;
  tournament_id: string;
  round_number: number;
  scheduled_time: string;
}

// Tournament match (links to existing matches table)
export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_id: string;
  round_number: number;
  match_id: string;
  court_number: number;
  status: TournamentMatchStatus;
  // Joined data from matches table
  played_at?: string;
  team1_players?: { id: string; name: string }[];
  team2_players?: { id: string; name: string }[];
  team1_score?: number;
  team2_score?: number;
  winner_team?: number;
}

// Tournament standings entry
export interface TournamentStanding {
  id: string;
  tournament_id: string;
  player_id: string;
  player_name?: string;
  points: number;
  wins: number;
  losses: number;
  rank?: number;
}

// Complete tournament with all related data
export interface TournamentDetail {
  tournament: Tournament;
  participants: TournamentParticipant[];
  rounds: TournamentRound[];
  matches: TournamentMatch[];
  standings: TournamentStanding[];
}

// For creating a new tournament
export interface CreateTournamentInput {
  group_id: string;
  name: string;
  format: TournamentFormat;
  start_date: string;
  scoring_system: ScoringSystem;
  court_count: number;
  participant_ids: string[];
}

// For updating tournament status
export interface UpdateTournamentStatusInput {
  tournament_id: string;
  status: TournamentStatus;
}

// For adding a participant
export interface AddParticipantInput {
  tournament_id: string;
  player_id: string;
  seed_position?: number;
}

// For updating match score
export interface UpdateMatchScoreInput {
  tournament_match_id: string;
  team1_games: number;
  team2_games: number;
}

// Schedule entry (for display)
export interface ScheduleEntry {
  round_number: number;
  scheduled_time: string;
  matches: {
    court_number: number;
    team1: { id: string; name: string }[];
    team2: { id: string; name: string }[];
    status: TournamentMatchStatus;
  }[];
}

// Validation result
export interface TournamentValidationResult {
  valid: boolean;
  errors: string[];
}

// Validate tournament creation input
export function validateCreateTournamentInput(
  input: CreateTournamentInput
): TournamentValidationResult {
  const errors: string[] = [];

  if (!input.name?.trim()) {
    errors.push("Tournament name is required");
  }

  if (!input.participant_ids || input.participant_ids.length < 4) {
    errors.push("Americano format requires at least 4 participants");
  }

  if (input.court_count < 1) {
    errors.push("At least 1 court is required");
  }

  if (!input.start_date) {
    errors.push("Start date is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Americano format utilities
export interface AmericanoPairing {
  round: number;
  court: number;
  team1: string[]; // player IDs
  team2: string[]; // player IDs
  sitOut?: string[]; // player IDs sitting out (for odd numbers)
}

// Generate Americano schedule
export function generateAmericanoSchedule(
  playerIds: string[],
  courtCount: number
): AmericanoPairing[] {
  const pairings: AmericanoPairing[] = [];
  const players = [...playerIds];
  const numPlayers = players.length;

  // Handle odd number of players by adding a "bye" player
  const hasBye = numPlayers % 2 !== 0;
  if (hasBye) {
    players.push("__BYE__");
  }

  const totalPlayers = players.length;
  const numRounds = totalPlayers - 1;
  const halfSize = totalPlayers / 2;

  // Use circle method for round-robin pairings
  // Fix player 0, rotate others
  for (let round = 0; round < numRounds; round++) {
    const roundPairings: AmericanoPairing[] = [];

    for (let i = 0; i < halfSize; i++) {
      const player1 = players[i];
      const player2 = players[totalPlayers - 1 - i];

      // Skip if either player is the bye
      if (player1 === "__BYE__" || player2 === "__BYE__") {
        continue;
      }

      const court = (i % courtCount) + 1;

      roundPairings.push({
        round: round + 1,
        court,
        team1: [player1],
        team2: [player2],
      });
    }

    // Rotate players (keep first player fixed)
    const lastPlayer = players.pop()!;
    players.splice(1, 0, lastPlayer);

    pairings.push(...roundPairings);
  }

  return pairings;
}

// Get status badge color
export function getTournamentStatusColor(status: TournamentStatus): string {
  switch (status) {
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Get status label
export function getTournamentStatusLabel(status: TournamentStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

// Get format label
export function getTournamentFormatLabel(format: TournamentFormat): string {
  switch (format) {
    case "americano":
      return "Americano";
    case "round_robin":
      return "Round Robin";
    case "bracket":
      return "Bracket";
    default:
      return format;
  }
}
