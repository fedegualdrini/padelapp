-- Allow web UI (anon/authenticated) to generate & update event occurrences.
-- Previously, the attendance planning migration only granted SELECT and had no write policies.

alter table public.event_occurrences enable row level security;

-- Members can insert occurrences for their group
drop policy if exists member_insert_event_occurrences on public.event_occurrences;
create policy member_insert_event_occurrences on public.event_occurrences
  for insert
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = event_occurrences.group_id
        and gm.user_id = auth.uid()
    )
  );

-- Members can update occurrences for their group (needed for linking loaded_match_id)
drop policy if exists member_update_event_occurrences on public.event_occurrences;
create policy member_update_event_occurrences on public.event_occurrences
  for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = event_occurrences.group_id
        and gm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = event_occurrences.group_id
        and gm.user_id = auth.uid()
    )
  );

grant insert, update on table public.event_occurrences to anon, authenticated;
