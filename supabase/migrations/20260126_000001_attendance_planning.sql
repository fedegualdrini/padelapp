-- Weekly attendance planning for recurring matches (Thursday 20:00)
-- Plan entities are separate from played matches.

-- Weekly schedule template per group
create table if not exists weekly_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null default 'Jueves 20:00',
  weekday smallint not null default 4, -- 0=Sun..6=Sat (Thursday=4)
  start_time time not null default '20:00',
  capacity integer not null default 4,
  cutoff_weekday smallint not null default 2, -- Tuesday=2
  cutoff_time time not null default '14:00',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_weekly_events_group on weekly_events(group_id);

-- Specific occurrence (a particular Thursday)
create table if not exists event_occurrences (
  id uuid primary key default gen_random_uuid(),
  weekly_event_id uuid not null references weekly_events(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  starts_at timestamptz not null,
  status text not null default 'open' check (status in ('open','locked','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (weekly_event_id, starts_at)
);

create index if not exists idx_event_occurrences_group on event_occurrences(group_id, starts_at);
create index if not exists idx_event_occurrences_weekly on event_occurrences(weekly_event_id, starts_at);

-- Track which occurrence is currently active for commands like !in/!out
alter table weekly_events add column if not exists active_occurrence_id uuid references event_occurrences(id);

-- WhatsApp identity mapping (phone number -> player)
create table if not exists whatsapp_identities (
  group_id uuid not null references groups(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  phone_e164 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, phone_e164),
  unique (group_id, player_id)
);

create index if not exists idx_whatsapp_identities_player on whatsapp_identities(group_id, player_id);

-- Admin mapping for the group (by player)
create table if not exists group_admins (
  group_id uuid not null references groups(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id)
);

-- Attendance per occurrence
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references event_occurrences(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  status text not null check (status in ('confirmed','declined','maybe','waitlist')),
  source text not null default 'whatsapp' check (source in ('whatsapp','web','admin')),
  last_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (occurrence_id, player_id)
);

create index if not exists idx_attendance_occurrence on attendance(occurrence_id, status);
create index if not exists idx_attendance_group on attendance(group_id, occurrence_id);

-- Trigger-like updated_at helper (reuse existing convention if present)
-- (Some projects use explicit updates; keep simple for now.)

-- RLS
alter table weekly_events enable row level security;
alter table event_occurrences enable row level security;
alter table attendance enable row level security;
alter table whatsapp_identities enable row level security;
alter table group_admins enable row level security;

-- Policies: membership-based access (same pattern as rest of app)
-- Allow members to view weekly events and occurrences for their group
create policy member_select_weekly_events on weekly_events
  for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = weekly_events.group_id and gm.user_id = auth.uid()
  ));

create policy member_select_event_occurrences on event_occurrences
  for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = event_occurrences.group_id and gm.user_id = auth.uid()
  ));

create policy member_select_attendance on attendance
  for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = attendance.group_id and gm.user_id = auth.uid()
  ));

-- For now, keep app writes off for events/occurrences/attendance/identity tables; add later when UI is built.
-- Bot will use direct DB access (service connection), not anon/auth.

-- Grants (needed in addition to RLS policies)
grant select on table weekly_events to anon, authenticated;
grant select on table event_occurrences to anon, authenticated;
grant select on table attendance to anon, authenticated;
grant select on table whatsapp_identities to anon, authenticated;
grant select on table group_admins to anon, authenticated;
