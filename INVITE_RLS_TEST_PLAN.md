# Group Invite System RLS Test Plan

## Overview
This document outlines the test plan to verify that the group invite system's RLS policies correctly enforce access controls.

## RLS Policies

### 1. `members_can_view_invites` (SELECT for authenticated)
**Purpose:** Group members can view invites for their groups
**Policy:**
```sql
group_id in (
  select group_id
  from group_members
  where user_id = auth.uid()
)
```

**Test Cases:**
- ✅ Member can view invites for their group
- ❌ Non-member cannot view invites for the group
- ❌ Anonymous users cannot view invites (RLS blocks direct access)

### 2. `members_can_create_invites` (INSERT for authenticated)
**Purpose:** Group members can create invites for their groups
**Policy:**
```sql
group_id in (
  select group_id
  from group_members
  where user_id = auth.uid()
)
and created_by = auth.uid()
```

**Test Cases:**
- ✅ Member can create invite for their group (via RPC function)
- ❌ Non-member cannot create invite for the group
- ❌ Anonymous users cannot create invites (function requires auth)

### 3. `members_can_delete_own_invites_in_groups_they_belong_to` (DELETE for authenticated)
**Purpose:** Users can only delete invites they created while still being members
**Policy:**
```sql
created_by = auth.uid()
and group_id in (
  select group_id
  from group_members
  where user_id = auth.uid()
)
```

**Test Cases:**
- ✅ Member can delete invite they created for their group
- ❌ Member cannot delete invite created by another member
- ❌ User cannot delete invite they created after leaving the group (SECURITY FIX)
- ❌ Non-member cannot delete any invite for the group

### 4. `anonymous_can_read_invites_for_validation` (SELECT for anon)
**Purpose:** Block direct table access, force use of RPC functions
**Policy:**
```sql
false
```

**Test Cases:**
- ❌ Anonymous users cannot SELECT from group_invites table directly
- ✅ Anonymous users can call `get_invite_details(text)` RPC function (granted to anon)
- ✅ Authenticated users can call `validate_and_use_invite(text)` RPC function (granted to authenticated)

## RPC Functions Security

### `create_group_invite(p_group_id, p_expires_in_days, p_max_uses)`
**Security Checks:**
1. ✅ Verifies `auth.uid() is not null`
2. ✅ Verifies user is a member of the group
3. ✅ Generates unique token
4. ✅ Inserts with `created_by = auth.uid()`

**Test Cases:**
- ✅ Member can create invite
- ❌ Non-member gets exception "Not a member of this group"
- ❌ Anonymous user gets exception "Not authenticated"

### `validate_and_use_invite(p_token)`
**Security Checks:**
1. ✅ Verifies `auth.uid() is not null`
2. ✅ Finds invite by token
3. ✅ Checks invite hasn't expired
4. ✅ Checks invite hasn't reached max uses
5. ✅ Checks user isn't already a member
6. ✅ Adds user to group
7. ✅ Updates invite usage count

**Test Cases:**
- ✅ Valid token adds user to group
- ❌ Invalid token returns "Invite not found"
- ❌ Expired token returns "Invite has expired"
- ❌ Max uses reached returns "Invite has reached maximum uses"
- ❌ Already member returns "Already a member of this group"

### `get_invite_details(p_token)`
**Security Checks:**
1. ✅ Finds invite by token
2. ✅ Returns group details (name, slug, etc.)
3. ✅ Validates invite (expiration, max uses)

**Test Cases:**
- ✅ Valid token returns invite details
- ❌ Invalid token returns "Invite not found"
- ❌ Expired token returns "Invite has expired"
- ❌ Max uses reached returns "Invite has reached maximum uses"
- ✅ Anonymous users can call this function (granted to anon)
- ✅ Returns group_name and group_slug for invite preview UI

## Security Gaps Fixed

### Previous Issue
The original `members_can_delete_own_invites` policy only checked `created_by = auth.uid()`, which allowed users to delete invites they created even after leaving the group.

### Fix Applied
New policy `members_can_delete_own_invites_in_groups_they_belong_to` checks both:
1. `created_by = auth.uid()` - User created the invite
2. `group_id in (select group_id from group_members where user_id = auth.uid())` - User is still a member

This ensures users can only delete invites for groups they still belong to.

## Migration Files

### 20260219_000001_group_invites.sql
Initial migration creating:
- `group_invites` table with indexes
- `generate_invite_token()` function
- `create_group_invite()` function
- `validate_and_use_invite()` function
- `get_invite_details()` function
- RLS policies (including the now-fixed DELETE policy)

### 20260219_000002_fix_group_invites_rls.sql
Security fix:
- Drops the old `members_can_delete_own_invites` policy
- Creates `members_can_delete_own_invites_in_groups_they_belong_to` with membership check
- Adds documentation comment on the table

## How to Test

### Manual Testing via Supabase Studio
1. Create two users (user1, user2)
2. Create a group (group1) with user1 as member
3. User1 creates an invite for group1
4. Verify user1 can view and delete the invite ✅
5. User2 joins group1
6. Verify user2 can view the invite ✅
7. Verify user2 cannot delete user1's invite ✅
8. user1 leaves group1
9. Verify user1 can view invite (if RLS allows former members?) ❌
10. Verify user1 cannot delete the invite anymore ✅ (SECURITY FIX)

### Testing with Anonymous Users
1. Generate an invite token
2. Call `get_invite_details('token')` as anonymous ✅
3. Try to `SELECT * FROM group_invites` as anonymous ❌
4. Call `validate_and_use_invite('token')` as new user ✅

## Compliance Checklist

- ✅ Group members can create invites
- ✅ Group members can view invites for their groups
- ✅ Group members can delete their own invites while members
- ✅ Non-members cannot access invites via direct SELECT
- ✅ Anonymous users can validate invites via RPC only
- ✅ RPC functions properly enforce authentication
- ✅ RPC functions check group membership for create operations
- ✅ DELETE policy prevents invite deletion after leaving group
- ✅ Anonymous table access blocked (forces RPC usage)
