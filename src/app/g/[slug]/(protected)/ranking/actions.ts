"use server";

import { getOrCreateRankingShareToken, getGroupBySlug, isGroupMember } from "@/lib/data";

export async function generateRankingShareLink(slug: string): Promise<{ token: string | null; error?: string }> {
  const group = await getGroupBySlug(slug);
  if (!group) {
    return { token: null, error: "Group not found" };
  }

  const member = await isGroupMember(group.id);
  if (!member) {
    return { token: null, error: "Not a group member" };
  }

  const token = await getOrCreateRankingShareToken(group.id);
  if (!token) {
    return { token: null, error: "Failed to generate share link" };
  }

  return { token };
}
