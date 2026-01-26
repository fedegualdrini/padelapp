-- Public, token-based ranking share link (no login)

alter table public.groups
  add column if not exists ranking_share_token text;

create unique index if not exists idx_groups_ranking_share_token
  on public.groups(ranking_share_token)
  where ranking_share_token is not null;

-- Seed tokens for existing groups
update public.groups
  set ranking_share_token = encode(gen_random_bytes(16), 'hex')
where ranking_share_token is null;

-- RPC: validate token and return ELO timeline rows (same source as ranking)
create or replace function public.get_public_ranking_timeline(p_slug text, p_token text)
returns table (
  player_id uuid,
  player_name text,
  player_status player_status,
  played_at timestamptz,
  rating integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select g.id into v_group_id
    from public.groups g
   where g.slug = p_slug
     and g.ranking_share_token = p_token
   limit 1;

  if v_group_id is null then
    return;
  end if;

  return query
  select
    p.id as player_id,
    p.name as player_name,
    p.status as player_status,
    m.played_at,
    er.rating
  from public.elo_ratings er
  join public.matches m on m.id = er.as_of_match_id
  join public.players p on p.id = er.player_id
  where m.group_id = v_group_id
    and p.group_id = v_group_id
  order by m.played_at asc, er.created_at asc;
end;
$$;

grant execute on function public.get_public_ranking_timeline(text, text) to anon, authenticated;
