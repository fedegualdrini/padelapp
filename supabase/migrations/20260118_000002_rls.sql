-- RLS policies for open access (anon) + grants
-- Note: Adjust or tighten policies later if you add auth.

-- Enable RLS
alter table groups enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table match_teams enable row level security;
alter table match_team_players enable row level security;
alter table sets enable row level security;
alter table set_scores enable row level security;
alter table elo_ratings enable row level security;
alter table audit_log enable row level security;

-- Open access policies
create policy "open_select_groups" on groups for select using (true);
create policy "open_insert_groups" on groups for insert with check (true);
create policy "open_update_groups" on groups for update using (true) with check (true);
create policy "open_delete_groups" on groups for delete using (true);

create policy "open_select_players" on players for select using (true);
create policy "open_insert_players" on players for insert with check (true);
create policy "open_update_players" on players for update using (true) with check (true);
create policy "open_delete_players" on players for delete using (true);

create policy "open_select_matches" on matches for select using (true);
create policy "open_insert_matches" on matches for insert with check (true);
create policy "open_update_matches" on matches for update using (true) with check (true);
create policy "open_delete_matches" on matches for delete using (true);

create policy "open_select_match_teams" on match_teams for select using (true);
create policy "open_insert_match_teams" on match_teams for insert with check (true);
create policy "open_update_match_teams" on match_teams for update using (true) with check (true);
create policy "open_delete_match_teams" on match_teams for delete using (true);

create policy "open_select_match_team_players" on match_team_players for select using (true);
create policy "open_insert_match_team_players" on match_team_players for insert with check (true);
create policy "open_update_match_team_players" on match_team_players for update using (true) with check (true);
create policy "open_delete_match_team_players" on match_team_players for delete using (true);

create policy "open_select_sets" on sets for select using (true);
create policy "open_insert_sets" on sets for insert with check (true);
create policy "open_update_sets" on sets for update using (true) with check (true);
create policy "open_delete_sets" on sets for delete using (true);

create policy "open_select_set_scores" on set_scores for select using (true);
create policy "open_insert_set_scores" on set_scores for insert with check (true);
create policy "open_update_set_scores" on set_scores for update using (true) with check (true);
create policy "open_delete_set_scores" on set_scores for delete using (true);

create policy "open_select_elo_ratings" on elo_ratings for select using (true);
create policy "open_insert_elo_ratings" on elo_ratings for insert with check (true);
create policy "open_update_elo_ratings" on elo_ratings for update using (true) with check (true);
create policy "open_delete_elo_ratings" on elo_ratings for delete using (true);

create policy "open_select_audit_log" on audit_log for select using (true);
create policy "open_insert_audit_log" on audit_log for insert with check (true);
create policy "open_update_audit_log" on audit_log for update using (true) with check (true);
create policy "open_delete_audit_log" on audit_log for delete using (true);

-- Grants for materialized views + functions
grant select on mv_player_stats to anon, authenticated;
grant select on mv_pair_stats to anon, authenticated;
grant select on mv_pair_aggregates to anon, authenticated;

grant execute on function refresh_stats_views() to anon, authenticated;
grant execute on function recompute_all_elo(integer) to anon, authenticated;
