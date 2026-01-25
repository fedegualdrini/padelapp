-- Enrich v_player_match_results with match metadata (group_id, played_at)
-- Needed because PostgREST cannot join a plain SQL view back to matches reliably.

create or replace view v_player_match_results_enriched as
select
  m.id as match_id,
  m.group_id,
  m.played_at,
  mt.team_number,
  mtp.player_id,
  case when mw.team_number = mt.team_number then true else false end as is_win
from matches m
join match_teams mt on mt.match_id = m.id
join match_team_players mtp on mtp.match_team_id = mt.id
join v_match_winners mw on mw.match_id = m.id;
