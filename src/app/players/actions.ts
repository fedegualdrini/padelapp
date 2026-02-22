"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const name = String(formData.get("player_name") ?? "").trim();
  const status = String(formData.get("player_status") ?? "invite").trim();
  const createdBy = String(formData.get("created_by") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const groupSlug = String(formData.get("group_slug") ?? "").trim();

  if (!name || !groupId || !groupSlug) {
    return { error: "El nombre del jugador es obligatorio." };
  }

  // Validate status
  if (status !== "usual" && status !== "invite") {
    return { error: "Estado de jugador inválido." };
  }

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
    name,
    status: status as "usual" | "invite",
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
  const name = String(formData.get("player_name") ?? "").trim();
  const updatedBy = String(formData.get("updated_by") ?? "").trim();
  const playerId = String(formData.get("player_id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const groupSlug = String(formData.get("group_slug") ?? "").trim();
  const editKey = String(formData.get("edit_key") ?? "").trim();

  if (!name || !playerId || !groupId || !groupSlug) {
    return { error: "El nombre del jugador es obligatorio." };
  }

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
    .update({ name, updated_by: updatedBy || null })
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
  return { success: true, name, editKey };
}

type RemovePlayerState = {
  error?: string;
  success?: boolean;
};

export async function removePlayer(
  prevState: RemovePlayerState | null,
  formData: FormData
): Promise<RemovePlayerState> {
  const supabaseServer = await createSupabaseServerClient();
  const playerId = String(formData.get("player_id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const groupSlug = String(formData.get("group_slug") ?? "").trim();

  if (!playerId || !groupId || !groupSlug) {
    return { error: "Faltan datos del jugador." };
  }

  const { data: authData, error: authError } =
    await supabaseServer.auth.getUser();
  if (authError) {
    console.error("removePlayer auth lookup failed", { authError });
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
    console.error("removePlayer membership check failed", { membershipError });
  }

  if (!membership) {
    return { error: "No tenés acceso a este grupo. Volvé a ingresar." };
  }

  // Check if player has matches before deleting
  const { data: teamPlayers, error: checkError } = await supabaseServer
    .from("match_team_players")
    .select("id")
    .eq("player_id", playerId)
    .limit(1);

  if (checkError) {
    console.error("removePlayer match check failed", { checkError });
  }

  if (teamPlayers && teamPlayers.length > 0) {
    return { error: "No se puede eliminar: el jugador tiene partidos registrados. Considerá marcarlo como 'invitado' en su lugar." };
  }

  const { error } = await supabaseServer
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("group_id", groupId);

  if (error) {
    console.error("removePlayer delete failed", { error });
    if (
      error.message?.includes("row-level security") ||
      error.code === "42501"
    ) {
      return { error: "No tenés acceso a este grupo. Volvé a ingresar." };
    }
    return { error: "No se pudo eliminar el jugador." };
  }

  revalidatePath(`/g/${groupSlug}/players`);
  return { success: true };
}
