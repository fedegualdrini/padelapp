-- Allow web UI (anon/authenticated) to insert and update attendance.
-- Previously, attendance had only SELECT; interaction (Voy / Maybe / No) needs INSERT/UPDATE.

alter table public.attendance enable row level security;

-- Members can insert attendance for their group
drop policy if exists member_insert_attendance on public.attendance;
create policy member_insert_attendance on public.attendance
  for insert
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = attendance.group_id
        and gm.user_id = auth.uid()
    )
  );

-- Members can update attendance for their group
drop policy if exists member_update_attendance on public.attendance;
create policy member_update_attendance on public.attendance
  for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = attendance.group_id
        and gm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = attendance.group_id
        and gm.user_id = auth.uid()
    )
  );

grant insert, update on table public.attendance to anon, authenticated;
