-- Include mv_player_stats_v2 in refresh helpers so UI stats fully reset after wiping matches.

create or replace function public.refresh_stats_views_blocking()
returns void as $$
begin
  refresh materialized view public.mv_player_stats;
  refresh materialized view public.mv_player_stats_v2;
  refresh materialized view public.mv_pair_stats;
  refresh materialized view public.mv_pair_aggregates;
end;
$$ language plpgsql security definer set search_path = public;

-- keep the concurrent refresher in sync too (best effort; can still be used outside transactions)
create or replace function public.refresh_stats_views()
returns void as $$
begin
  refresh materialized view concurrently public.mv_player_stats;
  refresh materialized view concurrently public.mv_player_stats_v2;
  refresh materialized view concurrently public.mv_pair_stats;
  refresh materialized view concurrently public.mv_pair_aggregates;
end;
$$ language plpgsql security definer set search_path = public;
