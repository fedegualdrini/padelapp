"use server";

import { revalidatePath } from "next/cache";
import { getGroupBySlug, isGroupMember } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deleteMatch(
  slug: string,
  matchId: string
): Promise<{ success: boolean; error?: string }> {
  const group = await getGroupBySlug(slug);
  if (!group) {
    return { success: false, error: "Grupo no encontrado" };
  }

  const member = await isGroupMember(group.id);
  if (!member) {
    return { success: false, error: "No sos miembro del grupo" };
  }

  const supabase = await createSupabaseServerClient();

  // Verify the match belongs to this group
  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", matchId)
    .eq("group_id", group.id)
    .single();

  if (fetchError || !match) {
    return { success: false, error: "Partido no encontrado" };
  }

  // Delete the match (cascade will handle related records)
  const { error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId);

  if (deleteError) {
    console.error("Error deleting match:", deleteError);
    return { success: false, error: "Error al eliminar el partido" };
  }

  // Recompute ELO and refresh stats
  await supabase.rpc("recompute_all_elo", { p_k: 32 });
  await supabase.rpc("refresh_stats_views");

  revalidatePath(`/g/${slug}/matches`);

  return { success: true };
}

export async function getOrCreateMatchShareToken(slug: string, matchId: string): Promise<{ token: string | null; error?: string }> {
  const group = await getGroupBySlug(slug);
  if (!group) {
    return { token: null, error: "Group not found" };
  }

  const member = await isGroupMember(group.id);
  if (!member) {
    return { token: null, error: "Not a group member" };
  }

  const supabase = await createSupabaseServerClient();
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
