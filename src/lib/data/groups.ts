// src/lib/data/groups.ts - Group-related data functions
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const getSupabaseServerClient = async () => createSupabaseServerClient();

export type Group = { id: string; name: string; slug: string };

export async function getGroups() {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("groups")
    .select("id, name, slug")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Group[];
}

export const getGroupBySlug = cache(async (slug: string) => {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("groups")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Group;
});

export async function getGroupByMatchId(matchId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("matches")
    .select("group_id")
    .eq("id", matchId)
    .single();

  if (error || !data?.group_id) {
    return null;
  }

  const { data: group, error: groupError } = await supabaseServer
    .from("groups")
    .select("id, name, slug")
    .eq("id", data.group_id)
    .single();

  if (groupError || !group) {
    return null;
  }

  return group as Group;
}

export async function isGroupMember(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return false;
  }

  const { data, error } = await supabaseServer
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}
