"use server";

import { getGroupBySlug, isGroupMember } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function getOrCreateMatchShareToken(slug: string, matchId: string): Promise<{ token: string | null; error?: string }> {
  const group = await getGroupBySlug(slug);
  if (!group) {
    return { token: null, error: "Group not found" };
  }

  const member = await isGroupMember(group.id);
  if (!member) {
    return { token: null, error: "Not a group member" };
  }

  const supabase = createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("match_share_tokens")
    .select("token")
    .eq("match_id", matchId)
    .single();

  if (fetchError) {
    console.error("Error fetching existing share token:", fetchError);
    return { token: null, error: "Failed to check for existing token" };
  }

  if (existing) {
    return { token: existing.token };
  }

  const token = crypto.randomUUID();
  const { error: insertError } = await supabase
    .from("match_share_tokens")
    .insert({ match_id: matchId, token })
    .select("token")
    .single();

  if (insertError) {
    console.error("Error creating share token:", insertError);
    return { token: null, error: "Failed to generate share link" };
  }

  return { token };
}
