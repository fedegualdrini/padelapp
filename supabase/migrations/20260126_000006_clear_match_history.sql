-- Allow group members to wipe all match history (used by UI "Clear match history" button)

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

  -- Break FK references from occurrences to matches first.
  update public.event_occurrences
     set loaded_match_id = null,
         loaded_at = null,
         updated_at = now()
   where group_id = p_group_id;

  -- Cascade will remove match_teams, sets, set_scores, match_team_players, elo_ratings.
  delete from public.matches
   where group_id = p_group_id;

  -- Keep derived stats consistent.
  begin
    perform public.refresh_stats_views();
  exception when others then
    -- best effort
    null;
  end;
end;
$$;

grant execute on function public.clear_group_match_history(uuid) to anon, authenticated;
