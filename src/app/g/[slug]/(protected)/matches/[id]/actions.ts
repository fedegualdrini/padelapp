"use server";

import { getOrCreateMatchShareToken, getGroupBySlug, isGroupMember } from "@/lib/data";

export async function getOrCreateMatchShareToken(slug: string, matchId: string): Promise<{ token: string | null; error?: string }> {
  const group = await getGroupBySlug(slug);
  if (!group) {
    return { token: null, error: "Group not found" };
  }

  const member = await isGroupMember(group.id);
  if (!member) {
    return { token: null, error: "Not a group member" };
  }

  const token = await getOrCreateMatchShareToken(matchId);
  if (!token) {
    return { token: null, error: "Failed to generate share link" };
  }

  return { token };
}
