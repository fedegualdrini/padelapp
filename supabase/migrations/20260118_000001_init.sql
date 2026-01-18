-- Initial schema for padel app (Supabase/PostgreSQL)
create extension if not exists "pgcrypto";

-- Enums
create type player_status as enum ('usual', 'invite');

-- Core tables
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  status player_status not null default 'invite',
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  played_at timestamptz not null,
  best_of smallint not null default 3 check (best_of in (3, 5)),
  created_by text not null,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table match_teams (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  team_number smallint not null check (team_number in (1, 2)),
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, team_number)
);

create table match_team_players (
  id uuid primary key default gen_random_uuid(),
  match_team_id uuid not null references match_teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_team_id, player_id)
);

create table sets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  set_number smallint not null check (set_number between 1 and 5),
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, set_number)
);

create table set_scores (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references sets(id) on delete cascade,
  team1_games smallint not null check (team1_games between 0 and 7),
  team2_games smallint not null check (team2_games between 0 and 7),
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (set_id),
  check (
    (team1_games = 6 and team2_games between 0 and 4) or
    (team2_games = 6 and team1_games between 0 and 4) or
    (team1_games = 7 and team2_games in (5, 6)) or
    (team2_games = 7 and team1_games in (5, 6))
  )
);

create table elo_ratings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  rating integer not null default 1000,
  as_of_match_id uuid not null references matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (player_id, as_of_match_id)
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  changed_by text,
  changed_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_players
before update on players
for each row execute function set_updated_at();

create trigger set_updated_at_matches
before update on matches
for each row execute function set_updated_at();

create trigger set_updated_at_match_teams
before update on match_teams
for each row execute function set_updated_at();

create trigger set_updated_at_match_team_players
before update on match_team_players
for each row execute function set_updated_at();

create trigger set_updated_at_sets
before update on sets
for each row execute function set_updated_at();

create trigger set_updated_at_set_scores
before update on set_scores
for each row execute function set_updated_at();

-- audit trigger
create or replace function audit_trigger()
returns trigger as $$
declare
  v_changed_by text;
begin
  v_changed_by := coalesce(
    current_setting('app.changed_by', true),
    (to_jsonb(new)->>'updated_by'),
    (to_jsonb(new)->>'created_by'),
    (to_jsonb(old)->>'updated_by'),
    (to_jsonb(old)->>'created_by')
  );

  if (tg_op = 'DELETE') then
    insert into audit_log(entity_type, entity_id, action, before_json, after_json, changed_by)
    values (tg_table_name, old.id, tg_op, to_jsonb(old), null, v_changed_by);
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into audit_log(entity_type, entity_id, action, before_json, after_json, changed_by)
    values (tg_table_name, new.id, tg_op, to_jsonb(old), to_jsonb(new), v_changed_by);
    return new;
  else
    insert into audit_log(entity_type, entity_id, action, before_json, after_json, changed_by)
    values (tg_table_name, new.id, tg_op, null, to_jsonb(new), v_changed_by);
    return new;
  end if;
end;
$$ language plpgsql;

create trigger audit_players
after insert or update or delete on players
for each row execute function audit_trigger();

create trigger audit_matches
after insert or update or delete on matches
for each row execute function audit_trigger();

create trigger audit_match_teams
after insert or update or delete on match_teams
for each row execute function audit_trigger();

create trigger audit_match_team_players
after insert or update or delete on match_team_players
for each row execute function audit_trigger();

create trigger audit_sets
after insert or update or delete on sets
for each row execute function audit_trigger();

create trigger audit_set_scores
after insert or update or delete on set_scores
for each row execute function audit_trigger();

-- Indexes
create index idx_players_group on players(group_id);
create index idx_matches_group_played_at on matches(group_id, played_at desc);
create index idx_match_teams_match on match_teams(match_id);
create index idx_match_team_players_team on match_team_players(match_team_id);
create index idx_sets_match on sets(match_id);
create index idx_set_scores_set on set_scores(set_id);
create index idx_elo_player on elo_ratings(player_id);
create index idx_elo_match on elo_ratings(as_of_match_id);
create index idx_audit_entity on audit_log(entity_type, entity_id);

-- Stats views/materialized views
create view v_set_winners as
select
  s.match_id,
  s.id as set_id,
  case when ss.team1_games > ss.team2_games then 1 else 2 end as team_number_winner
from sets s
join set_scores ss on ss.set_id = s.id;

create view v_match_team_set_wins as
select
  match_id,
  team_number_winner as team_number,
  count(*)::int as sets_won
from v_set_winners
group by match_id, team_number_winner;

create view v_match_winners as
select
  m.id as match_id,
  mt.team_number,
  mt.sets_won
from matches m
join v_match_team_set_wins mt on mt.match_id = m.id
join lateral (
  select max(sets_won) as max_sw
  from v_match_team_set_wins
  where match_id = m.id
) mx on true
where mt.sets_won = mx.max_sw;

create view v_player_match_results as
select
  m.id as match_id,
  mt.team_number,
  mtp.player_id,
  case when mw.team_number = mt.team_number then true else false end as is_win
from matches m
join match_teams mt on mt.match_id = m.id
join match_team_players mtp on mtp.match_team_id = mt.id
join v_match_winners mw on mw.match_id = m.id;

create materialized view mv_player_stats as
select
  p.id as player_id,
  p.group_id,
  count(*) filter (where pmr.is_win) as wins,
  count(*) filter (where not pmr.is_win) as losses,
  case
    when count(*) = 0 then 0
    else round((count(*) filter (where pmr.is_win))::numeric / count(*)::numeric, 4)
  end as win_rate
from players p
left join v_player_match_results pmr on pmr.player_id = p.id
group by p.id, p.group_id;

create unique index idx_mv_player_stats_player on mv_player_stats(player_id);

create materialized view mv_pair_stats as
select
  least(p1.player_id, p2.player_id) as player_a_id,
  greatest(p1.player_id, p2.player_id) as player_b_id,
  m.id as match_id,
  mt.team_number,
  case when mw.team_number = mt.team_number then true else false end as is_win
from matches m
join match_teams mt on mt.match_id = m.id
join match_team_players p1 on p1.match_team_id = mt.id
join match_team_players p2 on p2.match_team_id = mt.id and p1.player_id < p2.player_id
join v_match_winners mw on mw.match_id = m.id;

create unique index idx_mv_pair_stats_key on mv_pair_stats(player_a_id, player_b_id, match_id);

create materialized view mv_pair_aggregates as
select
  player_a_id,
  player_b_id,
  count(*) as matches_played,
  count(*) filter (where is_win) as wins,
  count(*) filter (where not is_win) as losses,
  case
    when count(*) = 0 then 0
    else round((count(*) filter (where is_win))::numeric / count(*)::numeric, 4)
  end as win_rate
from mv_pair_stats
group by player_a_id, player_b_id;

create unique index idx_mv_pair_aggregates_pair on mv_pair_aggregates(player_a_id, player_b_id);

-- Helper function to refresh stats
create or replace function refresh_stats_views()
returns void as $$
begin
  refresh materialized view concurrently mv_player_stats;
  refresh materialized view concurrently mv_pair_stats;
  refresh materialized view concurrently mv_pair_aggregates;
end;
$$ language plpgsql;

-- ELO helpers
create or replace function get_player_elo_before(p_player_id uuid, p_match_id uuid)
returns integer as $$
declare
  v_rating integer;
begin
  select er.rating into v_rating
  from elo_ratings er
  join matches m on m.id = er.as_of_match_id
  join matches cur on cur.id = p_match_id
  where er.player_id = p_player_id
    and (
      m.played_at < cur.played_at or
      (m.played_at = cur.played_at and m.created_at < cur.created_at)
    )
  order by m.played_at desc, m.created_at desc
  limit 1;

  return coalesce(v_rating, 1000);
end;
$$ language plpgsql;

create or replace function is_match_complete(p_match_id uuid)
returns boolean as $$
declare
  v_best_of smallint;
  v_required smallint;
  v_max_sets_won int;
begin
  select best_of into v_best_of from matches where id = p_match_id;
  if v_best_of is null then
    return false;
  end if;

  v_required := (v_best_of / 2) + 1;

  select max(sets_won) into v_max_sets_won
  from v_match_team_set_wins
  where match_id = p_match_id;

  return coalesce(v_max_sets_won, 0) >= v_required;
end;
$$ language plpgsql;

create or replace function apply_match_elo(p_match_id uuid, p_k integer default 32)
returns void as $$
declare
  v_team1_avg numeric;
  v_team2_avg numeric;
  v_expected_team1 numeric;
  v_expected_team2 numeric;
  v_team1_win boolean;
  v_team2_win boolean;
  v_team1_ids uuid[];
  v_team2_ids uuid[];
  v_player_id uuid;
  v_old integer;
  v_new integer;
begin
  if not is_match_complete(p_match_id) then
    return;
  end if;

  -- Clear previous ratings for this match (in case of edits)
  delete from elo_ratings where as_of_match_id = p_match_id;

  select array_agg(mtp.player_id order by mtp.player_id)
    into v_team1_ids
  from match_teams mt
  join match_team_players mtp on mtp.match_team_id = mt.id
  where mt.match_id = p_match_id and mt.team_number = 1;

  select array_agg(mtp.player_id order by mtp.player_id)
    into v_team2_ids
  from match_teams mt
  join match_team_players mtp on mtp.match_team_id = mt.id
  where mt.match_id = p_match_id and mt.team_number = 2;

  if v_team1_ids is null or array_length(v_team1_ids, 1) <> 2 then
    return;
  end if;
  if v_team2_ids is null or array_length(v_team2_ids, 1) <> 2 then
    return;
  end if;

  select (get_player_elo_before(v_team1_ids[1], p_match_id) + get_player_elo_before(v_team1_ids[2], p_match_id)) / 2.0
    into v_team1_avg;
  select (get_player_elo_before(v_team2_ids[1], p_match_id) + get_player_elo_before(v_team2_ids[2], p_match_id)) / 2.0
    into v_team2_avg;

  v_expected_team1 := 1 / (1 + power(10, (v_team2_avg - v_team1_avg) / 400.0));
  v_expected_team2 := 1 - v_expected_team1;

  select (mw.team_number = 1), (mw.team_number = 2)
    into v_team1_win, v_team2_win
  from v_match_winners mw
  where mw.match_id = p_match_id
  limit 1;

  -- Team 1 updates
  foreach v_player_id in array v_team1_ids loop
    v_old := get_player_elo_before(v_player_id, p_match_id);
    v_new := round(v_old + p_k * ((case when v_team1_win then 1 else 0 end) - v_expected_team1));
    insert into elo_ratings(player_id, rating, as_of_match_id)
    values (v_player_id, v_new, p_match_id);
  end loop;

  -- Team 2 updates
  foreach v_player_id in array v_team2_ids loop
    v_old := get_player_elo_before(v_player_id, p_match_id);
    v_new := round(v_old + p_k * ((case when v_team2_win then 1 else 0 end) - v_expected_team2));
    insert into elo_ratings(player_id, rating, as_of_match_id)
    values (v_player_id, v_new, p_match_id);
  end loop;
end;
$$ language plpgsql;

create or replace function recompute_all_elo(p_k integer default 32)
returns void as $$
declare
  v_match_id uuid;
begin
  truncate table elo_ratings;
  for v_match_id in
    select id
    from matches
    order by played_at asc, created_at asc
  loop
    perform apply_match_elo(v_match_id, p_k);
  end loop;
end;
$$ language plpgsql;

create or replace function maybe_apply_elo()
returns trigger as $$
declare
  v_match_id uuid;
begin
  if (tg_table_name = 'set_scores') then
    select s.match_id into v_match_id
    from sets s
    where s.id = coalesce(new.set_id, old.set_id);
  elsif (tg_table_name = 'sets') then
    v_match_id := coalesce(new.match_id, old.match_id);
  elsif (tg_table_name = 'match_team_players') then
    select mt.match_id into v_match_id
    from match_teams mt
    where mt.id = coalesce(new.match_team_id, old.match_team_id);
  elsif (tg_table_name = 'match_teams') then
    v_match_id := coalesce(new.match_id, old.match_id);
  else
    v_match_id := coalesce(new.id, old.id);
  end if;

  if v_match_id is not null then
    perform apply_match_elo(v_match_id, 32);
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger elo_on_set_scores
after insert or update or delete on set_scores
for each row execute function maybe_apply_elo();

create trigger elo_on_sets
after insert or update or delete on sets
for each row execute function maybe_apply_elo();

create trigger elo_on_match_team_players
after insert or update or delete on match_team_players
for each row execute function maybe_apply_elo();

create trigger elo_on_match_teams
after insert or update or delete on match_teams
for each row execute function maybe_apply_elo();

create trigger elo_on_matches
after insert or update or delete on matches
for each row execute function maybe_apply_elo();
