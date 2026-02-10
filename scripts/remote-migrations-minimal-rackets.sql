-- Minimal: create rackets and match_rackets tables only (no functions).
-- Use this when the full racket_performance_tracker migration cannot run (e.g. missing match columns).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  weight INTEGER CHECK (weight IS NULL OR (weight >= 300 AND weight <= 400)),
  balance INTEGER CHECK (balance IS NULL OR (balance >= 250 AND balance <= 310)),
  purchase_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rackets_player_brand_model_unique UNIQUE(player_id, brand, model)
);
CREATE INDEX IF NOT EXISTS idx_rackets_player_id ON rackets(player_id);
CREATE INDEX IF NOT EXISTS idx_rackets_is_active ON rackets(is_active);
CREATE INDEX IF NOT EXISTS idx_rackets_created_at ON rackets(created_at DESC);

CREATE TABLE IF NOT EXISTS match_rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  racket_id UUID REFERENCES rackets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT match_rackets_match_player_unique UNIQUE(match_id, player_id)
);
CREATE INDEX IF NOT EXISTS idx_match_rackets_match_id ON match_rackets(match_id);
CREATE INDEX IF NOT EXISTS idx_match_rackets_player_id ON match_rackets(player_id);
CREATE INDEX IF NOT EXISTS idx_match_rackets_racket_id ON match_rackets(racket_id);

ALTER TABLE rackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_rackets ENABLE ROW LEVEL SECURITY;
-- Policies are added by 20260202_000002_rackets_rls_group_members.sql
