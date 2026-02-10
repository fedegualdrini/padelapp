// Partnership types for Partner Synergy Analytics feature

// Partnership summary for leaderboard and cards
export interface Partnership {
  player1_id: string;
  player2_id: string;
  player1_name?: string;
  player2_name?: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_elo_change_when_paired: number;
  avg_individual_elo_change: number;
  elo_change_delta: number;
  common_opponents_beaten: number;
  first_played_together: string;
  last_played_together: string;
  refreshed_at: string;
}

// Simplified partnership summary for cards/tables
export interface PartnershipSummary extends Partnership {
  player1_avatar_url?: string;
  player2_avatar_url?: string;
  synergy_score?: number;
}

// Individual player info for partnership detail
export interface PlayerInfo {
  id: string;
  name: string;
  current_elo: number;
  avatar_url?: string;
}

// Detailed partnership statistics
export interface PartnershipDetail {
  player1: PlayerInfo;
  player2: PlayerInfo;
  partnership: {
    matches_played: number;
    wins: number;
    losses: number;
    win_rate: number;
    avg_elo_change_when_paired: number;
    avg_individual_elo_change: number;
    elo_change_delta: number;
    first_played_together: string;
    last_played_together: string;
    synergy_score: number;
  };
  match_history: MatchHistoryItem[];
  common_opponents?: CommonOpponent[];
}

// Single match in partnership history
export interface MatchHistoryItem {
  match_id: string;
  played_at: string;
  team: number; // 1 or 2
  opponent_team_players: PlayerInfo[];
  result: "win" | "loss";
  score_summary: string; // e.g., "6-4, 6-3"
  elo_change_player1: number;
  elo_change_player2: number;
}

// Common opponent analysis
export interface CommonOpponent {
  player_id: string;
  name: string;
  matches_played_together: number;
  wins: number;
  losses: number;
  win_rate: number;
}

// API response with pagination
export interface PartnershipsResponse {
  partnerships: Partnership[];
  total: number;
  page?: number;
  per_page?: number;
}

// Best/worst partners for a specific player
export interface PlayerPartnershipsResponse {
  player_id: string;
  player_name: string;
  best_partners: PartnershipSummary[];
  worst_partners: PartnershipSummary[];
  total_partnerships: number;
}

// Query parameters for partnerships API
export interface PartnershipsQueryParams {
  player_id?: string;
  min_matches?: number;
  sort_by?: "win_rate" | "matches_played" | "elo_change_delta" | "synergy_score";
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// Synergy score calculation options
export interface SynergyScoreOptions {
  win_rate_weight?: number; // default 0.5
  elo_delta_weight?: number; // default 0.3
  opponent_quality_weight?: number; // default 0.2
}

// Calculate synergy score from partnership data
export function calculateSynergyScore(
  partnership: Partnership,
  options: SynergyScoreOptions = {}
): number {
  const {
    win_rate_weight = 0.5,
    elo_delta_weight = 0.3,
    opponent_quality_weight = 0.2,
  } = options;

  // Win rate contribution (0 to 1)
  const win_rate_contrib = partnership.win_rate;

  // Normalized ELO delta contribution (-1 to 1, clamped)
  // Divide by 100 to normalize ELO changes
  const elo_delta_normalized = Math.max(
    -1,
    Math.min(1, partnership.elo_change_delta / 100)
  );
  const elo_delta_contrib = elo_delta_normalized;

  // Opponent quality contribution (0 to 1)
  // Use common opponents beaten as a proxy, normalized by matches played
  const opponent_quality_contrib = partnership.matches_played > 0
    ? Math.min(1, partnership.common_opponents_beaten / partnership.matches_played)
    : 0;

  // Weighted sum
  return (
    win_rate_contrib * win_rate_weight +
    elo_delta_contrib * elo_delta_weight +
    opponent_quality_contrib * opponent_quality_weight
  );
}

// Determine partnership tier for UI
export function getPartnershipTier(win_rate: number): "excellent" | "good" | "fair" | "poor" {
  if (win_rate >= 0.7) return "excellent";
  if (win_rate >= 0.6) return "good";
  if (win_rate >= 0.5) return "fair";
  return "poor";
}

// Get badge text for matches played
export function getMatchesBadge(matches: number): string {
  if (matches >= 10) return "Established";
  if (matches >= 5) return "Developing";
  return "New";
}

// Get ELO delta indicator
export function getEloDeltaIndicator(delta: number): "positive" | "negative" | "neutral" {
  if (delta > 2) return "positive";
  if (delta < -2) return "negative";
  return "neutral";
}
