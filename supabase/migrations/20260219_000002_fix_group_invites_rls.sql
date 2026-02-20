-- Fix security gap in group_invites RLS policies
-- Issue: Users could delete invites they created even after leaving the group
-- Solution: DELETE policy now verifies both creator status AND current membership

-- Drop the old delete policy that only checked created_by
drop policy if exists members_can_delete_own_invites on group_invites;

-- Create improved delete policy that checks both creator and current membership
-- Users can only delete invites if:
-- 1. They created the invite (created_by = auth.uid())
-- 2. They are still a member of the group
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

-- Add comment to document RLS behavior
comment on table group_invites is '
Group invite system with secure token-based invite links.

Access Control:
- Group members can create invite links for their groups
- Group members can view invite links for their groups
- Group members can only delete invite links they created AND while they are still members
- Non-members cannot access invite links directly (RLS blocks SELECT)
- Anonymous users can validate invites via RPC functions (get_invite_details, validate_and_use_invite)
  but cannot view the invites table directly

Security Definer Functions:
- create_group_invite: Creates an invite for a group (members only)
- validate_and_use_invite: Validates and uses an invite token (adds user to group)
- get_invite_details: Gets invite details without requiring membership (for invite validation UI)
';
