"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug, isGroupMember } from "@/lib/data";

export async function clearMatchHistory(slug: string) {
  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("clear_group_match_history", {
    p_group_id: group.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/matches`);
  revalidatePath(`/g/${slug}`);
  revalidatePath(`/g/${slug}/ranking`);
  revalidatePath(`/g/${slug}/players`);
}

