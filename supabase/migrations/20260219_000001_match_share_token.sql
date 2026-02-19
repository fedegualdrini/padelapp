-- Public, token-based match share link (no login)

alter table public.matches
  add column if not exists share_token text;

create unique index if not exists idx_matches_share_token
  on public.matches(share_token)
  where share_token is not null;

-- Seed tokens for existing matches
update public.matches
  set share_token = encode(gen_random_bytes(16), 'hex')
where share_token is null;

-- RPC: validate token and return match details with scores and ELO deltas
create or replace function public.get_public_match_details(p_slug text, p_token text)
returns table (
  match_id uuid,
  played_at timestamptz,
  best_of smallint,
  team1_name text,
  team2_name text,
  team1_score integer,
  team2_score integer,
  team1_sets jsonb,
  team2_sets jsonb,
  elo_deltas jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_match_id uuid;
begin
  select g.id, m.id into v_group_id, v_match_id
    from public.matches m
    join public.groups g on g.id = m.group_id
   where g.slug = p_slug
     and m.share_token = p_token
   limit 1;

  if v_group_id is null then
    return;
  end if;

  return query
  with match_sets as (
    select
      s.set_number,
      sc.team1_games,
      sc.team2_games
    from public.sets s
    join public.set_scores sc on sc.set_id = s.id
    where s.match_id = v_match_id
    order by s.set_number
  ),
  team1_players as (
    select string_agg(p.name, ' & ') as team_name
    from public.match_teams mt
    join public.match_team_players mtp on mtp.match_team_id = mt.id
    join public.players p on p.id = mtp.player_id
    where mt.match_id = v_match_id
      and mt.team_number = 1
  ),
  team2_players as (
    select string_agg(p.name, ' & ') as team_name
    from public.match_teams mt
    join public.match_team_players mtp on mtp.match_team_id = mt.id
    join public.players p on p.id = mtp.player_id
    where mt.match_id = v_match_id
      and mt.team_number = 2
  ),
  elo_data as (
    select
      p.name as player_name,
      er.rating as current_rating,
      lag(er.rating) over (partition by p.id order by er.created_at) as previous_rating
    from public.elo_ratings er
    join public.players p on p.id = er.player_id
    where er.as_of_match_id = v_match_id
      and p.group_id = v_group_id
  )
  select
    m.id as match_id,
    m.played_at,
    m.best_of,
    (select team_name from team1_players) as team1_name,
    (select team_name from team2_players) as team2_name,
    (select sum(team1_games) from match_sets) as team1_score,
    (select sum(team2_games) from match_sets) as team2_score,
    (select jsonb_agg(jsonb_build_object('games', team1_games, 'opponent', team2_games)) from match_sets) as team1_sets,
    (select jsonb_agg(jsonb_build_object('games', team2_games, 'opponent', team1_games)) from match_sets) as team2_sets,
    (
      select jsonb_agg(
        jsonb_build_object(
          'name', player_name,
          'previous', previous_rating,
          'current', current_rating,
          'delta', coalesce(current_rating - previous_rating, 0)
        )
      )
      from elo_data
      where previous_rating is not null
    ) as elo_deltas
  from public.matches m
  where m.id = v_match_id;
end;
$$;

grant execute on function public.get_public_match_details(text, text) to anon, authenticated;
