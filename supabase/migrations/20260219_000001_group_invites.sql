-- Group invite system for secure invite links
-- Create a unique token-based invite system for groups

-- Create group_invites table
create table if not exists group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  token text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  max_uses integer default null, -- null means unlimited uses
  use_count integer default 0
);

-- Index for fast token lookups
create index if not exists idx_group_invites_token on group_invites(token);
create index if not exists idx_group_invites_group_id on group_invites(group_id);
create index if not exists idx_group_invites_created_by on group_invites(created_by);

-- Function to generate a secure invite token
create or replace function generate_invite_token()
returns text as $$
begin
  -- Generate a 32-character random hex string
  return encode(gen_random_bytes(16), 'hex');
end;
$$ language plpgsql security definer;

-- Function to create a group invite
create or replace function create_group_invite(
  p_group_id uuid,
  p_expires_in_days integer default null,
  p_max_uses integer default null
)
returns table (id uuid, token text, expires_at timestamptz) as $$
declare
  v_token text;
  v_token_exists boolean;
  v_expires_at timestamptz;
begin
  -- Check if user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if user is a member of the group
  if not exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this group';
  end if;

  -- Calculate expiration time
  if p_expires_in_days is not null then
    v_expires_at := now() + (p_expires_in_days || ' days')::interval;
  end if;

  -- Generate a unique token
  loop
    v_token := generate_invite_token();
    select exists (select 1 from group_invites where token = v_token) into v_token_exists;
    exit when not v_token_exists;
  end loop;

  -- Insert the new invite
  insert into group_invites (group_id, token, created_by, expires_at, max_uses)
  values (p_group_id, v_token, auth.uid(), v_expires_at, p_max_uses)
  returning id, token, expires_at into id, token, expires_at;

  return;
end;
$$ language plpgsql security definer set search_path = public;

-- Function to validate and use a group invite
create or replace function validate_and_use_invite(
  p_token text
)
returns table (group_id uuid, success boolean, message text) as $$
declare
  v_invite record;
begin
  -- Check if user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Find the invite
  select * into v_invite
  from group_invites
  where token = p_token
  for update; -- Lock the row to prevent race conditions

  -- Check if invite exists
  if v_invite is null then
    return query select null::uuid, false, 'Invite not found'::text;
    return;
  end if;

  -- Check if invite has expired
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return query select v_invite.group_id, false, 'Invite has expired'::text;
    return;
  end if;

  -- Check if invite has reached max uses
  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    return query select v_invite.group_id, false, 'Invite has reached maximum uses'::text;
    return;
  end if;

  -- Check if user is already a member
  if exists (
    select 1 from group_members
    where group_id = v_invite.group_id and user_id = auth.uid()
  ) then
    return query select v_invite.group_id, false, 'Already a member of this group'::text;
    return;
  end if;

  -- Add user to the group
  insert into group_members (group_id, user_id)
  values (v_invite.group_id, auth.uid())
  on conflict do nothing;

  -- Update invite usage
  update group_invites
  set use_count = use_count + 1,
      used_by = auth.uid(),
      used_at = now()
  where id = v_invite.id;

  return query select v_invite.group_id, true, 'Successfully joined group'::text;
end;
$$ language plpgsql security definer set search_path = public;

-- Function to get invite details
create or replace function get_invite_details(p_token text)
returns table (
  group_id uuid,
  group_name text,
  group_slug text,
  token text,
  created_at timestamptz,
  expires_at timestamptz,
  max_uses integer,
  use_count integer,
  is_valid boolean,
  message text
) as $$
declare
  v_invite record;
  v_group record;
begin
  -- Find the invite
  select * into v_invite
  from group_invites
  where token = p_token;

  -- Check if invite exists
  if v_invite is null then
    return query select null::uuid, null::text, null::text, p_token::text, null::timestamptz,
                         null::timestamptz, null::integer, 0, false, 'Invite not found'::text;
    return;
  end if;

  -- Get group details
  select id, name, slug into v_group
  from groups
  where id = v_invite.group_id;

  -- Check if invite is valid
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return query select v_group.id, v_group.name, v_group.slug, v_invite.token,
                         v_invite.created_at, v_invite.expires_at, v_invite.max_uses,
                         v_invite.use_count, false, 'Invite has expired'::text;
    return;
  end if;

  if v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses then
    return query select v_group.id, v_group.name, v_group.slug, v_invite.token,
                         v_invite.created_at, v_invite.expires_at, v_invite.max_uses,
                         v_invite.use_count, false, 'Invite has reached maximum uses'::text;
    return;
  end if;

  -- Invite is valid
  return query select v_group.id, v_group.name, v_group.slug, v_invite.token,
                       v_invite.created_at, v_invite.expires_at, v_invite.max_uses,
                       v_invite.use_count, true, 'Invite is valid'::text;
end;
$$ language plpgsql security definer set search_path = public;

-- Grant execute permissions on functions
grant execute on function generate_invite_token() to authenticated;
grant execute on function create_group_invite(uuid, integer, integer) to authenticated;
grant execute on function validate_and_use_invite(text) to authenticated;
grant execute on function get_invite_details(text) to authenticated, anon;

-- Enable RLS
alter table group_invites enable row level security;

-- RLS Policies

-- Group members can see invites for their groups
create policy members_can_view_invites
on group_invites
for select
to authenticated
using (
  group_id in (
    select group_id
    from group_members
    where user_id = auth.uid()
  )
);

-- Group members can create invites for their groups
create policy members_can_create_invites
on group_invites
for insert
to authenticated
with check (
  group_id in (
    select group_id
    from group_members
    where user_id = auth.uid()
  )
  and created_by = auth.uid()
);

-- Group members can delete their own invites
create policy members_can_delete_own_invites
on group_invites
for delete
to authenticated
using (
  created_by = auth.uid()
);

-- Anonymous users can validate invites (needed for invite links)
-- This is handled through the RPC function which has its own security
create policy anonymous_can_read_invites_for_validation
on group_invites
for select
to anon
using (false); -- Deny direct table access, use RPC functions instead
