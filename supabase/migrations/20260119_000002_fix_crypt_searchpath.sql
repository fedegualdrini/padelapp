-- Fix create_group_with_passphrase with correct search_path including extensions
create or replace function create_group_with_passphrase(
  p_name text,
  p_slug_base text,
  p_passphrase text
)
returns table (id uuid, slug text) as $$
declare
  v_slug text;
  v_suffix int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Group name required';
  end if;
  if p_passphrase is null or length(trim(p_passphrase)) = 0 then
    raise exception 'Passphrase required';
  end if;

  v_slug := p_slug_base;
  loop
    exit when not exists (select 1 from groups where groups.slug = v_slug);
    v_suffix := v_suffix + 1;
    v_slug := p_slug_base || '-' || v_suffix;
  end loop;

  insert into groups (name, slug, passphrase_hash)
  values (p_name, v_slug, crypt(p_passphrase, gen_salt('bf')))
  returning groups.id, groups.slug into create_group_with_passphrase.id, create_group_with_passphrase.slug;

  insert into group_members (group_id, user_id)
  values (create_group_with_passphrase.id, auth.uid())
  on conflict do nothing;

  return next;
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- Also fix join_group_with_passphrase with correct search_path
create or replace function join_group_with_passphrase(
  p_slug text,
  p_passphrase text
)
returns uuid as $$
declare
  v_group_id uuid;
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_slug is null or length(trim(p_slug)) = 0 then
    raise exception 'Group slug required';
  end if;
  if p_passphrase is null or length(trim(p_passphrase)) = 0 then
    raise exception 'Passphrase required';
  end if;

  select groups.id, groups.passphrase_hash
    into v_group_id, v_hash
  from groups
  where groups.slug = p_slug;

  if v_group_id is null then
    raise exception 'Group not found';
  end if;

  if crypt(p_passphrase, v_hash) <> v_hash then
    raise exception 'Invalid passphrase';
  end if;

  insert into group_members (group_id, user_id)
  values (v_group_id, auth.uid())
  on conflict do nothing;

  return v_group_id;
end;
$$ language plpgsql security definer set search_path = public, extensions;

grant execute on function create_group_with_passphrase(text, text, text) to anon, authenticated;
grant execute on function join_group_with_passphrase(text, text) to anon, authenticated;
