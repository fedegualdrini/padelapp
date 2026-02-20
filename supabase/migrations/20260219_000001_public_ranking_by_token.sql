-- Get ranking data using just the share token (no slug needed)
-- Returns group info and current player rankings with ELO

create or replace function public.get_public_ranking_by_token(p_token text)
returns table (
  group_id uuid,
  group_name text,
  group_slug text,
  player_id uuid,
  player_name text,
  player_status player_status,
  current_elo integer,
  matches_played bigint,
  elo_change integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  -- Validate token and get group_id
  select g.id into v_group_id
    from public.groups g
   where g.ranking_share_token = p_token
   limit 1;

  if v_group_id is null then
    return;
  end if;

  -- Return group info and current rankings
  return query
  select
    g.id as group_id,
    g.name as group_name,
    g.slug as group_slug,
    p.id as player_id,
    p.name as player_name,
    p.status as player_status,
    er.rating as current_elo,
    -- Count matches played
    (select count(*)
       from public.match_players mp
       join public.matches m on m.id = mp.match_id
      where m.group_id = v_group_id
        and mp.player_id = p.id) as matches_played,
    -- Calculate ELO change from previous match
    (
      select coalesce(er2.rating - (
        select er3.rating
          from public.elo_ratings er3
          join public.matches m3 on m3.id = er3.as_of_match_id
         where er3.player_id = p.id
           and m3.group_id = v_group_id
           and m3.played_at < (
             select m2.played_at
               from public.matches m2
              where m2.id = er.as_of_match_id
           )
         order by m3.played_at desc, er3.created_at desc
         limit 1
      ), 0)
      from public.elo_ratings er2
      where er2.player_id = p.id
        and er2.as_of_match_id = (
          select m2.id
            from public.matches m2
           where m2.group_id = v_group_id
           order by m2.played_at desc
           limit 1
        )
    ) as elo_change
  from public.elo_ratings er
  join public.matches m on m.id = er.as_of_match_id
  join public.players p on p.id = er.player_id
  join public.groups g on g.id = v_group_id
  where er.as_of_match_id = (
    -- Get the most recent match for this group
    select m2.id
      from public.matches m2
     where m2.group_id = v_group_id
     order by m2.played_at desc
     limit 1
  )
    and p.group_id = v_group_id
  order by er.rating desc;
end;
$$;

grant execute on function public.get_public_ranking_by_token(text) to anon, authenticated;
