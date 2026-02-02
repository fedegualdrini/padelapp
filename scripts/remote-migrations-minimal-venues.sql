-- Minimal: create venues table only. RLS policies added by 20260202_000003.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  website VARCHAR(255),
  phone VARCHAR(50),
  num_courts INTEGER NOT NULL CHECK (num_courts > 0),
  surface_type VARCHAR(50) NOT NULL CHECK (surface_type IN ('glass', 'cement', 'artificial_grass', 'other')),
  indoor_outdoor VARCHAR(20) NOT NULL CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both')),
  lighting VARCHAR(50) NOT NULL CHECK (lighting IN ('led', 'fluorescent', 'natural', 'none')),
  climate_control BOOLEAN NOT NULL DEFAULT FALSE,
  has_showers BOOLEAN NOT NULL DEFAULT FALSE,
  has_changing_rooms BOOLEAN NOT NULL DEFAULT FALSE,
  has_lockers BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking BOOLEAN NOT NULL DEFAULT FALSE,
  has_bar_restaurant BOOLEAN NOT NULL DEFAULT FALSE,
  has_water_fountain BOOLEAN NOT NULL DEFAULT FALSE,
  has_wifi BOOLEAN NOT NULL DEFAULT FALSE,
  has_equipment_rental BOOLEAN NOT NULL DEFAULT FALSE,
  photos JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES players(id) ON DELETE SET NULL,
  CONSTRAINT venues_slug_group_unique UNIQUE(group_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_venues_group_id ON venues(group_id);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_created_by ON venues(created_by);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- One policy so members can read; 20260202_000003 replaces admin policies with group-member policies.
CREATE POLICY "Group members can read venues" ON venues FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
