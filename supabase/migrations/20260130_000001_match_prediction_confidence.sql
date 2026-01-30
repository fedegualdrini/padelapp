-- Add prediction confidence columns to matches table
alter table matches
  add column if not exists predicted_win_prob numeric,
  add column if not exists prediction_factors jsonb,
  add column if not exists prediction_correct boolean;

-- Add index for faster prediction accuracy queries
create index if not exists idx_matches_prediction_correct
  on matches(prediction_correct)
  where prediction_correct is not null;
