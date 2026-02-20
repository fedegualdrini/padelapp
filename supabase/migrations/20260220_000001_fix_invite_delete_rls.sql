-- Fix RLS policy for invite deletion
-- Issue: Users could delete invites after leaving a group
-- Fix: Verify both creator status AND current membership

-- Drop the old policy
drop policy if exists members_can_delete_own_invites on group_invites;

-- Create the corrected policy that verifies current membership
create policy members_can_delete_own_invites_in_groups_they_belong_to
on group_invites
for delete
to authenticated
using (
  created_by = auth.uid()
  and group_id in (
    select group_id
    from group_members
    where user_id = auth.uid()
  )
);
