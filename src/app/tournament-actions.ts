"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateTournamentInput,
  UpdateTournamentStatusInput,
  AddParticipantInput,
  UpdateMatchScoreInput,
} from "@/lib/tournament-types";
import { validateCreateTournamentInput } from "@/lib/tournament-types";

// Create a new tournament
export async function createTournamentAction(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();

  // Get current user
  const { data: authData, error: authError } = await supabaseServer.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error("Debes iniciar sesión para crear un torneo.");
  }

  // Parse form data
  const groupId = String(formData.get("group_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const format = String(formData.get("format") ?? "americano").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const scoringSystem = String(formData.get("scoring_system") ?? "standard_21").trim();
  const courtCount = parseInt(String(formData.get("court_count") ?? "1"), 10);
  const participantIdsJson = String(formData.get("participant_ids") ?? "[]").trim();

  let participantIds: string[];
  try {
    participantIds = JSON.parse(participantIdsJson);
  } catch {
    throw new Error("Participantes inválidos.");
  }

  // Validate input
  const validation = validateCreateTournamentInput({
    group_id: groupId,
    name,
    format: format as "americano" | "round_robin" | "bracket",
    start_date: startDate,
    scoring_system: scoringSystem as "standard_21" | "custom",
    court_count: courtCount,
    participant_ids: participantIds,
  });

  if (!validation.valid) {
    throw new Error(validation.errors.join(". "));
  }

  // Create tournament via RPC
  const { data: tournament, error } = await supabaseServer.rpc("create_tournament", {
    p_group_id: groupId,
    p_name: name,
    p_format: format,
    p_start_date: startDate,
    p_scoring_system: scoringSystem,
    p_court_count: courtCount,
    p_participant_ids: participantIds,
  });

  if (error || !tournament) {
    console.error("createTournamentAction error:", error);
    throw new Error(`No se pudo crear el torneo.${error?.message ? ` ${error.message}` : ""}`);
  }

  // Revalidate group page
  revalidatePath(`/g/${groupId}`);

  // Redirect to tournament page
  redirect(`/g/${groupId}/tournaments/${tournament.id}`);
}

// Update tournament status
export async function updateTournamentStatusAction(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();

  const tournamentId = String(formData.get("tournament_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();

  if (!tournamentId || !status) {
    throw new Error("Datos incompletos.");
  }

  const { error } = await supabaseServer.rpc("update_tournament_status", {
    p_tournament_id: tournamentId,
    p_status: status,
  });

  if (error) {
    console.error("updateTournamentStatusAction error:", error);
    throw new Error(`No se pudo actualizar el estado del torneo.${error.message ? ` ${error.message}` : ""}`);
  }

  // Revalidate paths
  if (groupId) {
    revalidatePath(`/g/${groupId}/tournaments/${tournamentId}`);
  }

  return { success: true };
}

// Add participant to tournament
export async function addTournamentParticipantAction(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();

  const tournamentId = String(formData.get("tournament_id") ?? "").trim();
  const playerId = String(formData.get("player_id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();

  if (!tournamentId || !playerId) {
    throw new Error("Datos incompletos.");
  }

  const { error } = await supabaseServer.rpc("add_tournament_participant", {
    p_tournament_id: tournamentId,
    p_player_id: playerId,
    p_seed_position: null,
  });

  if (error) {
    console.error("addTournamentParticipantAction error:", error);
    throw new Error(`No se pudo agregar el participante.${error.message ? ` ${error.message}` : ""}`);
  }

  // Revalidate paths
  if (groupId) {
    revalidatePath(`/g/${groupId}/tournaments/${tournamentId}`);
  }

  return { success: true };
}

// Update match score
export async function updateTournamentMatchScoreAction(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();

  const tournamentMatchId = String(formData.get("tournament_match_id") ?? "").trim();
  const team1Games = parseInt(String(formData.get("team1_games") ?? "0"), 10);
  const team2Games = parseInt(String(formData.get("team2_games") ?? "0"), 10);
  const groupId = String(formData.get("group_id") ?? "").trim();
  const tournamentId = String(formData.get("tournament_id") ?? "").trim();

  if (!tournamentMatchId) {
    throw new Error("Datos incompletos.");
  }

  const { error } = await supabaseServer.rpc("update_match_score", {
    p_tournament_match_id: tournamentMatchId,
    p_team1_games: team1Games,
    p_team2_games: team2Games,
  });

  if (error) {
    console.error("updateTournamentMatchScoreAction error:", error);
    throw new Error(`No se pudo actualizar el marcador.${error.message ? ` ${error.message}` : ""}`);
  }

  // Revalidate paths
  if (groupId && tournamentId) {
    revalidatePath(`/g/${groupId}/tournaments/${tournamentId}`);
  }

  return { success: true };
}

// Delete tournament
export async function deleteTournamentAction(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();

  const tournamentId = String(formData.get("tournament_id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();

  if (!tournamentId) {
    throw new Error("ID de torneo requerido.");
  }

  // Delete tournament (cascade will handle related records)
  const { error } = await supabaseServer
    .from("tournaments")
    .delete()
    .eq("id", tournamentId);

  if (error) {
    console.error("deleteTournamentAction error:", error);
    throw new Error(`No se pudo eliminar el torneo.${error.message ? ` ${error.message}` : ""}`);
  }

  // Revalidate and redirect
  if (groupId) {
    revalidatePath(`/g/${groupId}`);
    redirect(`/g/${groupId}`);
  }

  return { success: true };
}
