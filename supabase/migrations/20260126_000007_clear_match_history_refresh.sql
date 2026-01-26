-- Fix: refresh_stats_views() uses CONCURRENTLY (cannot run inside function/txn).
-- Provide a non-concurrent refresh for destructive operations like full wipes.

create or replace function public.refresh_stats_views_blocking()
returns void as $$
begin
  refresh materialized view public.mv_player_stats;
  refresh materialized view public.mv_pair_stats;
  refresh materialized view public.mv_pair_aggregates;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.refresh_stats_views_blocking() to anon, authenticated;

create or replace function public.clear_group_match_history(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
      from public.group_members gm
     where gm.group_id = p_group_id
       and gm.user_id = auth.uid()
  ) then
    raise exception 'Not a group member';
  end if;

  update public.event_occurrences
     set loaded_match_id = null,
         loaded_at = null,
         updated_at = now()
   where group_id = p_group_id;

  delete from public.matches
   where group_id = p_group_id;

  -- IMPORTANT: must NOT use CONCURRENTLY here; this function runs inside a transaction.
  begin
    perform public.refresh_stats_views_blocking();
  exception when others then
    null;
  end;
end;
$$;

grant execute on function public.clear_group_match_history(uuid) to anon, authenticated;
