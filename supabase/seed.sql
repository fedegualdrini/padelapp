-- Seed data for padel app
-- Replace player names below as needed.

insert into groups (id, name, slug, passphrase_hash)
values (
  '00000000-0000-0000-0000-000000000001',
  'Padel Group',
  'padel',
  crypt('padel', gen_salt('bf'))
);

insert into players (group_id, name, status)
values
  ('00000000-0000-0000-0000-000000000001', 'Fachi', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Lucho', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Leo', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Nico', 'usual'),
  ('00000000-0000-0000-0000-000000000001', 'Fede', 'usual');

-- ============================================================
-- VENUE TEST DATA
-- ============================================================

-- Insert test venues
insert into venues (
  id, group_id, name, slug, address, website, phone, num_courts,
  surface_type, indoor_outdoor, lighting, climate_control,
  has_showers, has_changing_rooms, has_lockers, has_parking,
  has_bar_restaurant, has_water_fountain, has_wifi, has_equipment_rental,
  photos, created_by
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Club Padel Madrid',
    'club-padel-madrid',
    'Calle del Padel, 123, Madrid',
    'https://clubpadelmadrid.com',
    '+34 912 345 678',
    6,
    'glass', 'indoor', 'led', true,
    true, true, true, true, true, true, true, false,
    '[]'::jsonb,
    (select id from players where name = 'Fede' limit 1)
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Padel Center Norte',
    'padel-center-norte',
    'Avenida del Deporte, 456, Madrid',
    'https://padelcenternorte.es',
    '+34 913 456 789',
    4,
    'artificial_grass', 'outdoor', 'natural', false,
    true, true, false, true, false, true, false, true,
    '[]'::jsonb,
    (select id from players where name = 'Fede' limit 1)
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'Padel Premium Indoor',
    'padel-premium-indoor',
    'Paseo de la Castellana, 789, Madrid',
    null,
    '+34 914 567 890',
    8,
    'glass', 'indoor', 'led', true,
    true, true, true, true, true, true, true, true,
    '[]'::jsonb,
    (select id from players where name = 'Fede' limit 1)
  );

-- Insert test venue ratings
insert into venue_ratings (
  venue_id, player_id, group_id, court_quality, lighting, comfort, amenities, accessibility, atmosphere, review_text
)
select
  v.id,
  p.id,
  v.group_id,
  4 + floor(random() * 2)::int, -- 4-5 stars
  4 + floor(random() * 2)::int,
  3 + floor(random() * 3)::int, -- 3-5 stars
  4 + floor(random() * 2)::int,
  3 + floor(random() * 3)::int,
  4 + floor(random() * 2)::int,
  case 
    when p.name = 'Fede' then 'Excelente cancha, muy buena iluminación y las duchas están impecables.'
    when p.name = 'Lucho' then 'Me encanta jugar aquí, el ambiente es muy bueno.'
    else null
  end
from venues v
join players p on v.group_id = p.group_id
where v.slug = 'club-padel-madrid';

-- Refresh venue analytics after inserting ratings
refresh materialized view venue_analytics;

-- ============================================================
-- CHALLENGES & BADGES TEST DATA
-- ============================================================

-- Insert badge definitions
insert into badges (name, description, badge_type, milestone_value, icon, display_order)
values
  ('Semana Perfecta', 'Completa todos los desafíos de una semana', 'weekly_complete', null, '🏆', 1),
  ('Racha de 4', 'Completa 4 semanas consecutivas', 'streak_milestone', 4, '🔥', 2),
  ('Racha de 8', 'Completa 8 semanas consecutivas', 'streak_milestone', 8, '🔥🔥', 3),
  ('Racha de 12', 'Completa 12 semanas consecutivas', 'streak_milestone', 12, '🔥🔥🔥', 4),
  ('Primera Victoria', 'Gana tu primer partido', 'special', null, '🎯', 5);

-- Insert group challenge settings
insert into group_challenge_settings (group_id, enabled, active_challenge_types, difficulty_level)
values (
  '00000000-0000-0000-0000-000000000001',
  true,
  '{volume,performance,social}',
  'medium'
);

-- Insert current week challenges
insert into weekly_challenges (group_id, week_start, challenge_type, target_value)
values
  ('00000000-0000-0000-0000-000000000001', date_trunc('week', current_date)::date, 'volume', 3),
  ('00000000-0000-0000-0000-000000000001', date_trunc('week', current_date)::date, 'performance', 2),
  ('00000000-0000-0000-0000-000000000001', date_trunc('week', current_date)::date, 'social', 1);

-- Insert streaks for players
insert into streaks (player_id, group_id, current_streak, longest_streak, last_completed_week)
select
  p.id,
  p.group_id,
  case 
    when p.name = 'Fede' then 3
    when p.name = 'Lucho' then 2
    else 1
  end,
  case 
    when p.name = 'Fede' then 5
    when p.name = 'Lucho' then 3
    else 1
  end,
  date_trunc('week', current_date)::date - interval '1 week'
from players p;

-- Insert player weekly progress
insert into player_weekly_progress (
  player_id, group_id, week_start, 
  challenges_completed, challenge_volume_completed, challenge_performance_completed, challenge_social_completed
)
select
  p.id,
  p.group_id,
  date_trunc('week', current_date)::date,
  case 
    when p.name = 'Fede' then 3
    when p.name = 'Lucho' then 2
    else 1
  end,
  p.name = 'Fede' or p.name = 'Lucho',
  p.name = 'Fede',
  p.name = 'Fede'
from players p;

-- Insert earned badges for Fede
insert into player_badges (player_id, badge_id, earned_at)
select
  p.id,
  b.id,
  now() - interval '7 days'
from players p
join badges b on b.name in ('Semana Perfecta', 'Racha de 4')
where p.name = 'Fede';
