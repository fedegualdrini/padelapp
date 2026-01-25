-- Player stats that include total matches played (including undecided matches)

create or replace view public.v_player_match_participation_enriched as
select
  m.id as match_id,
  m.group_id,
  m.played_at,
  mt.team_number,
  mtp.player_id,
  case
    when mw.team_number is null then null
    when mw.team_number = mt.team_number then true
    else false
  end as is_win
from public.matches m
join public.match_teams mt on mt.match_id = m.id
join public.match_team_players mtp on mtp.match_team_id = mt.id
left join public.v_match_winners mw on mw.match_id = m.id;

-- Keep original mv_player_stats intact; add a v2 with matches_played + undecided.
create materialized view if not exists public.mv_player_stats_v2 as
select
  p.id as player_id,
  p.group_id,
  count(v.match_id) as matches_played,
  count(*) filter (where v.is_win is true) as wins,
  count(*) filter (where v.is_win is false) as losses,
  count(*) filter (where v.is_win is null) as undecided,
  case
    when count(*) filter (where v.is_win is true or v.is_win is false) = 0 then 0
    else round(
      (count(*) filter (where v.is_win is true))::numeric /
      (count(*) filter (where v.is_win is true or v.is_win is false))::numeric,
      4
    )
  end as win_rate
from public.players p
left join public.v_player_match_participation_enriched v
  on v.player_id = p.id
 and v.group_id = p.group_id
group by p.id, p.group_id;

create unique index if not exists idx_mv_player_stats_v2_player
  on public.mv_player_stats_v2(player_id);

-- Grant select
grant select on public.mv_player_stats_v2 to anon, authenticated;
