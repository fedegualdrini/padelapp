// ============================================================================
// Racket Performance Tracker Types
// ============================================================================

export type Racket = {
  id: string;
  player_id: string;
  brand: string;
  model: string;
  weight: number | null;
  balance: number | null;
  purchase_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RacketInput = {
  brand: string;
  model: string;
  weight?: number | null;
  balance?: number | null;
  purchase_date?: string | null;
  is_active?: boolean;
};

export type RacketUpdateInput = Partial<RacketInput> & {
  id: string;
};

export type MatchRacket = {
  id: string;
  match_id: string;
  player_id: string;
  racket_id: string | null;
  created_at: string;
};

export type RacketStats = {
  racket_id: string;
  matches_played: number;
  matches_won: number;
  win_rate: number;
  elo_change: number;
  avg_elo: number;
  best_elo_gain: number;
  worst_elo_drop: number;
  last_used: string | null;
};

export type RacketPerformanceOverTime = {
  match_date: string;
  cumulative_matches_played: number;
  rolling_win_rate: number | null;
  cumulative_elo_change: number;
  elo_at_match: number;
};

export type RacketComparison = {
  racket_id: string;
  brand: string | null;
  model: string | null;
  matches_played: number;
  matches_won: number;
  win_rate: number;
  elo_change: number;
  avg_elo: number;
  best_elo_gain: number;
  worst_elo_drop: number;
  last_used: string | null;
};

export type PlayerRacketInsight = {
  insight_type: 'best_performing' | 'most_used' | 'aging_warning';
  insight_text: string;
  racket_id: string | null;
  racket_name: string | null;
  metric_value: number;
  metric_label: string;
};

export type RacketWithStats = Racket & {
  stats: RacketStats | null;
};
