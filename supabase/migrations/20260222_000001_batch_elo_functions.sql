-- Migration: Batch ELO functions to avoid N+1 queries
-- Created: 2026-02-22
-- Purpose: Optimize getMatchEloDeltas by fetching previous ELO for multiple players in one query

-- Batch version of get_player_elo_before that returns ELO before a match for multiple players
create or replace function get_players_elo_before(
  p_player_ids uuid[],
  p_match_id uuid
)
returns table (player_id uuid, previous_elo integer)
as $$
declare
  v_match_played_at timestamptz;
  v_match_created_at timestamptz;
begin
  -- Get the target match's timestamps
  select m.played_at, m.created_at
  into v_match_played_at, v_match_created_at
  from matches m
  where m.id = p_match_id;

  if v_match_played_at is null then
    return;
  end if;

  -- For each player, find their ELO before this match
  return query
  with ranked_ratings as (
    select
      er.player_id,
      er.rating,
      row_number() over (
        partition by er.player_id
        order by m.played_at desc, m.created_at desc
      ) as rn
    from elo_ratings er
    join matches m on m.id = er.as_of_match_id
    where er.player_id = any(p_player_ids)
      and (
        m.played_at < v_match_played_at or
        (m.played_at = v_match_played_at and m.created_at < v_match_created_at)
      )
  )
  select
    rr.player_id,
    coalesce(rr.rating, 1000)::integer as previous_elo
  from ranked_ratings rr
  where rr.rn = 1

  union all

  -- Include players with no previous ELO (default to 1000)
  select
    u.player_id,
    1000 as previous_elo
  from unnest(p_player_ids) as u(player_id)
  where not exists (
    select 1 from ranked_ratings rr where rr.player_id = u.player_id
  );
end;
$$ language plpgsql stable;

-- Add comment documenting the function
comment on function get_players_elo_before(uuid[], uuid) is
  'Batch version of get_player_elo_before. Returns previous ELO for multiple players before a given match. Used to avoid N+1 queries in getMatchEloDeltas.';
