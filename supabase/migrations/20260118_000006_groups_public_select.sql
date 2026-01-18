-- Allow listing groups by name/slug while keeping all other data protected.

drop policy if exists member_select_groups on groups;

create policy public_select_groups on groups
  for select
  using (true);
