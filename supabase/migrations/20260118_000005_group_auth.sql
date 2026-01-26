-- Group passphrase + membership-based RLS
create extension if not exists "pgcrypto";

-- Passphrase hash on groups
alter table groups add column if not exists passphrase_hash text;
update groups
set passphrase_hash = crypt('padel', gen_salt('bf'))
where passphrase_hash is null;
alter table groups alter column passphrase_hash set not null;

-- Group membership table
create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists idx_group_members_user on group_members(user_id);

-- Functions for group creation/join (security definer)
create or replace function create_group_with_passphrase(
  p_name text,
  p_slug_base text,
  p_passphrase text
)
returns table (id uuid, slug text) as $$
declare
  v_slug text;
  v_suffix int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Group name required';
  end if;
  if p_passphrase is null or length(trim(p_passphrase)) = 0 then
    raise exception 'Passphrase required';
  end if;

  v_slug := p_slug_base;
  loop
    exit when not exists (select 1 from groups where slug = v_slug);
    v_suffix := v_suffix + 1;
    v_slug := p_slug_base || '-' || v_suffix;
  end loop;

  insert into groups (name, slug, passphrase_hash)
  values (p_name, v_slug, extensions.crypt(p_passphrase, extensions.gen_salt('bf')))
  returning groups.id, groups.slug into id, slug;

  insert into group_members (group_id, user_id)
  values (id, auth.uid())
  on conflict do nothing;

  return;
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function join_group_with_passphrase(
  p_slug text,
  p_passphrase text
)
returns uuid as $$
declare
  v_group_id uuid;
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_slug is null or length(trim(p_slug)) = 0 then
    raise exception 'Group slug required';
  end if;
  if p_passphrase is null or length(trim(p_passphrase)) = 0 then
    raise exception 'Passphrase required';
  end if;

  select id, passphrase_hash
    into v_group_id, v_hash
  from groups
  where slug = p_slug;

  if v_group_id is null then
    raise exception 'Group not found';
  end if;

  if extensions.crypt(p_passphrase, v_hash) <> v_hash then
    raise exception 'Invalid passphrase';
  end if;

  insert into group_members (group_id, user_id)
  values (v_group_id, auth.uid())
  on conflict do nothing;

  return v_group_id;
end;
$$ language plpgsql security definer set search_path = public, extensions;

grant execute on function create_group_with_passphrase(text, text, text) to anon, authenticated;
grant execute on function join_group_with_passphrase(text, text) to anon, authenticated;

-- Grants for new table
grant select, insert, update, delete on table group_members to anon, authenticated;

-- Refresh stats functions should run with elevated privileges
create or replace function refresh_stats_views()
returns void as $$
begin
  refresh materialized view concurrently mv_player_stats;
  refresh materialized view concurrently mv_pair_stats;
  refresh materialized view concurrently mv_pair_aggregates;
end;
$$ language plpgsql security definer set search_path = public;

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
$$ language plpgsql security definer set search_path = public;

-- Rebuild pair stats with group_id
drop materialized view if exists mv_pair_aggregates;
drop materialized view if exists mv_pair_stats;

create materialized view mv_pair_stats as
select
  m.group_id,
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

create unique index if not exists idx_mv_pair_stats_key
  on mv_pair_stats(group_id, player_a_id, player_b_id, match_id);

create materialized view mv_pair_aggregates as
select
  group_id,
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
group by group_id, player_a_id, player_b_id;

create unique index if not exists idx_mv_pair_aggregates_pair
  on mv_pair_aggregates(group_id, player_a_id, player_b_id);

-- Enable RLS on new tables (materialized views do not support RLS)
alter table group_members enable row level security;

-- Drop open policies
drop policy if exists open_select_groups on groups;
drop policy if exists open_insert_groups on groups;
drop policy if exists open_update_groups on groups;
drop policy if exists open_delete_groups on groups;

drop policy if exists open_select_players on players;
drop policy if exists open_insert_players on players;
drop policy if exists open_update_players on players;
drop policy if exists open_delete_players on players;

drop policy if exists open_select_matches on matches;
drop policy if exists open_insert_matches on matches;
drop policy if exists open_update_matches on matches;
drop policy if exists open_delete_matches on matches;

drop policy if exists open_select_match_teams on match_teams;
drop policy if exists open_insert_match_teams on match_teams;
drop policy if exists open_update_match_teams on match_teams;
drop policy if exists open_delete_match_teams on match_teams;

drop policy if exists open_select_match_team_players on match_team_players;
drop policy if exists open_insert_match_team_players on match_team_players;
drop policy if exists open_update_match_team_players on match_team_players;
drop policy if exists open_delete_match_team_players on match_team_players;

drop policy if exists open_select_sets on sets;
drop policy if exists open_insert_sets on sets;
drop policy if exists open_update_sets on sets;
drop policy if exists open_delete_sets on sets;

drop policy if exists open_select_set_scores on set_scores;
drop policy if exists open_insert_set_scores on set_scores;
drop policy if exists open_update_set_scores on set_scores;
drop policy if exists open_delete_set_scores on set_scores;

drop policy if exists open_select_elo_ratings on elo_ratings;
drop policy if exists open_insert_elo_ratings on elo_ratings;
drop policy if exists open_update_elo_ratings on elo_ratings;
drop policy if exists open_delete_elo_ratings on elo_ratings;

drop policy if exists open_select_audit_log on audit_log;
drop policy if exists open_insert_audit_log on audit_log;
drop policy if exists open_update_audit_log on audit_log;
drop policy if exists open_delete_audit_log on audit_log;

-- Membership-based policies
create policy member_select_groups on groups
  for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = id and gm.user_id = auth.uid()
  ));

create policy member_update_groups on groups
  for update
  using (exists (
    select 1 from group_members gm
    where gm.group_id = id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from group_members gm
    where gm.group_id = id and gm.user_id = auth.uid()
  ));

create policy member_select_group_members on group_members
  for select
  using (user_id = auth.uid());

create policy member_delete_group_members on group_members
  for delete
  using (user_id = auth.uid());

create policy member_select_players on players
  for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_insert_players on players
  for insert
  with check (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_update_players on players
  for update
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_delete_players on players
  for delete
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_select_matches on matches
  for select
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_insert_matches on matches
  for insert
  with check (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_update_matches on matches
  for update
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_delete_matches on matches
  for delete
  using (exists (
    select 1 from group_members gm
    where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy member_select_match_teams on match_teams
  for select
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_insert_match_teams on match_teams
  for insert
  with check (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_update_match_teams on match_teams
  for update
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_delete_match_teams on match_teams
  for delete
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_select_match_team_players on match_team_players
  for select
  using (exists (
    select 1
    from match_teams mt
    join matches m on m.id = mt.match_id
    join group_members gm on gm.group_id = m.group_id
    where mt.id = match_team_id and gm.user_id = auth.uid()
  ));

create policy member_insert_match_team_players on match_team_players
  for insert
  with check (exists (
    select 1
    from match_teams mt
    join matches m on m.id = mt.match_id
    join group_members gm on gm.group_id = m.group_id
    where mt.id = match_team_id and gm.user_id = auth.uid()
  ));

create policy member_update_match_team_players on match_team_players
  for update
  using (exists (
    select 1
    from match_teams mt
    join matches m on m.id = mt.match_id
    join group_members gm on gm.group_id = m.group_id
    where mt.id = match_team_id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from match_teams mt
    join matches m on m.id = mt.match_id
    join group_members gm on gm.group_id = m.group_id
    where mt.id = match_team_id and gm.user_id = auth.uid()
  ));

create policy member_delete_match_team_players on match_team_players
  for delete
  using (exists (
    select 1
    from match_teams mt
    join matches m on m.id = mt.match_id
    join group_members gm on gm.group_id = m.group_id
    where mt.id = match_team_id and gm.user_id = auth.uid()
  ));

create policy member_select_sets on sets
  for select
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_insert_sets on sets
  for insert
  with check (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_update_sets on sets
  for update
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_delete_sets on sets
  for delete
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = match_id and gm.user_id = auth.uid()
  ));

create policy member_select_set_scores on set_scores
  for select
  using (exists (
    select 1
    from sets s
    join matches m on m.id = s.match_id
    join group_members gm on gm.group_id = m.group_id
    where s.id = set_id and gm.user_id = auth.uid()
  ));

create policy member_insert_set_scores on set_scores
  for insert
  with check (exists (
    select 1
    from sets s
    join matches m on m.id = s.match_id
    join group_members gm on gm.group_id = m.group_id
    where s.id = set_id and gm.user_id = auth.uid()
  ));

create policy member_update_set_scores on set_scores
  for update
  using (exists (
    select 1
    from sets s
    join matches m on m.id = s.match_id
    join group_members gm on gm.group_id = m.group_id
    where s.id = set_id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from sets s
    join matches m on m.id = s.match_id
    join group_members gm on gm.group_id = m.group_id
    where s.id = set_id and gm.user_id = auth.uid()
  ));

create policy member_delete_set_scores on set_scores
  for delete
  using (exists (
    select 1
    from sets s
    join matches m on m.id = s.match_id
    join group_members gm on gm.group_id = m.group_id
    where s.id = set_id and gm.user_id = auth.uid()
  ));

create policy member_select_elo_ratings on elo_ratings
  for select
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = as_of_match_id and gm.user_id = auth.uid()
  ));

create policy member_insert_elo_ratings on elo_ratings
  for insert
  with check (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = as_of_match_id and gm.user_id = auth.uid()
  ));

create policy member_update_elo_ratings on elo_ratings
  for update
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = as_of_match_id and gm.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = as_of_match_id and gm.user_id = auth.uid()
  ));

create policy member_delete_elo_ratings on elo_ratings
  for delete
  using (exists (
    select 1
    from matches m
    join group_members gm on gm.group_id = m.group_id
    where m.id = as_of_match_id and gm.user_id = auth.uid()
  ));

grant select on mv_player_stats to anon, authenticated;
grant select on mv_pair_stats to anon, authenticated;
grant select on mv_pair_aggregates to anon, authenticated;

grant execute on function refresh_stats_views() to anon, authenticated;
grant execute on function recompute_all_elo(integer) to anon, authenticated;
