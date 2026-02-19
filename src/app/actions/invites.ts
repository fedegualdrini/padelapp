"use server";

import { revalidatePath } from "next/cache";
import {
  createGroupInvite,
  validateAndUseInvite,
  deleteGroupInvite,
  type GroupInvite,
} from "@/lib/data";

/**
 * Server Action: Create a new group invite link
 */
export async function createInviteAction(
  groupId: string,
  expiresInDays: number | null = null,
  maxUses: number | null = null
): Promise<{ success: boolean; invite: GroupInvite | null; error: string | null }> {
  try {
    const { invite, error } = await createGroupInvite(groupId, expiresInDays, maxUses);

    if (error) {
      return { success: false, invite: null, error };
    }

    // Revalidate the group page to show the new invite
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, invite, error: null };
  } catch (error) {
    console.error("Error in createInviteAction:", error);
    return {
      success: false,
      invite: null,
      error: error instanceof Error ? error.message : "Failed to create invite",
    };
  }
}

/**
 * Server Action: Validate and use a group invite
 */
export async function validateAndUseInviteAction(
  token: string
): Promise<{ success: boolean; groupId: string; error: string | null }> {
  try {
    const result = await validateAndUseInvite(token);

    if (!result.success) {
      return { success: false, groupId: "", error: result.message };
    }

    // Revalidate pages that might show group membership
    revalidatePath("/", "layout");
    revalidatePath("/g/[slug]", "page");

    return { success: true, groupId: result.groupId!, error: null };
  } catch (error) {
    console.error("Error in validateAndUseInviteAction:", error);
    return {
      success: false,
      groupId: "",
      error: error instanceof Error ? error.message : "Failed to validate invite",
    };
  }
}

/**
 * Server Action: Delete a group invite
 */
export async function deleteInviteAction(
  inviteId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await deleteGroupInvite(inviteId);

    if (error) {
      return { success: false, error };
    }

    // Revalidate the group page to reflect the deletion
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in deleteInviteAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete invite",
    };
  }
}

/**
 * Server Action: Copy invite link to clipboard (client-side helper)
 * This is a helper for the UI - actual copying happens client-side
 */
export async function copyInviteLinkAction(
  token: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/invite/${token}`;

    // This will be handled on the client side with navigator.clipboard
    return { success: true, error: null };
  } catch (error) {
    console.error("Error in copyInviteLinkAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to copy invite link",
    };
  }
}
