"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addPlayerSchema, updatePlayerSchema } from "@/lib/validation";

type AddPlayerState = {
  error?: string;
  success?: boolean;
};

type UpdatePlayerState = {
  error?: string;
  success?: boolean;
  name?: string;
  editKey?: string;
};

export async function addPlayer(
  prevState: AddPlayerState | null,
  formData: FormData
): Promise<AddPlayerState> {
  const supabaseServer = await createSupabaseServerClient();
  
  // Validate and sanitize input
  const validationResult = addPlayerSchema.safeParse({
    playerName: formData.get("player_name"),
    playerStatus: formData.get("player_status"),
    groupId: formData.get("group_id"),
    groupSlug: formData.get("group_slug"),
    createdBy: formData.get("created_by") || undefined,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { error: errorMessage };
  }

  const { playerName, playerStatus, groupId, groupSlug, createdBy } = validationResult.data;

  const { data: authData, error: authError } =
    await supabaseServer.auth.getUser();
  if (authError) {
    console.error("addPlayer auth lookup failed", { authError });
  }
  if (!authData?.user) {
    return { error: "La sesión expiró. Recargá e intentá de nuevo." };
  }

  const { data: membership, error: membershipError } = await supabaseServer
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("addPlayer membership check failed", { membershipError });
  }

  if (!membership) {
    return { error: "No tenés acceso a este grupo. Volvé a ingresar." };
  }

  const { error } = await supabaseServer.from("players").insert({
    group_id: groupId,
    name: playerName,
    status: playerStatus,
    updated_by: createdBy || null,
  });

  if (error) {
    console.error("addPlayer insert failed", { error });
    if (
      error.message?.includes("row-level security") ||
      error.code === "42501"
    ) {
      return { error: "No tenés acceso a este grupo. Volvé a ingresar." };
    }
    return { error: "No se pudo agregar el jugador." };
  }

  revalidatePath(`/g/${groupSlug}/players`);
  return { success: true };
}

export async function updatePlayer(
  prevState: UpdatePlayerState | null,
  formData: FormData
): Promise<UpdatePlayerState> {
  const supabaseServer = await createSupabaseServerClient();
  
  // Validate and sanitize input
  const validationResult = updatePlayerSchema.safeParse({
    playerId: formData.get("player_id"),
    playerName: formData.get("player_name"),
    groupId: formData.get("group_id"),
    groupSlug: formData.get("group_slug"),
    updatedBy: formData.get("updated_by") || undefined,
    editKey: formData.get("edit_key") || undefined,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { error: errorMessage };
  }

  const { playerId, playerName, groupId, groupSlug, updatedBy, editKey } = validationResult.data;

  const { data: authData, error: authError } =
    await supabaseServer.auth.getUser();
  if (authError) {
    console.error("updatePlayer auth lookup failed", { authError });
  }
  if (!authData?.user) {
    return { error: "La sesión expiró. Recargá e intentá de nuevo." };
  }

  const { data: membership, error: membershipError } = await supabaseServer
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("updatePlayer membership check failed", { membershipError });
  }

  if (!membership) {
    return { error: "No tenés acceso a este grupo. Volvé a ingresar." };
  }

  const { error } = await supabaseServer
    .from("players")
    .update({ name: playerName, updated_by: updatedBy || null })
    .eq("id", playerId)
    .eq("group_id", groupId);

  if (error) {
    console.error("updatePlayer update failed", { error });
    if (
      error.message?.includes("row-level security") ||
      error.code === "42501"
    ) {
      return { error: "No tenés acceso a este grupo. Volvé a ingresar." };
    }
    return { error: "No se pudo actualizar el jugador." };
  }

  revalidatePath(`/g/${groupSlug}/players`);
  return { success: true, name: playerName, editKey };
}
