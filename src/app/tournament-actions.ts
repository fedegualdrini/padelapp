"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createTournamentSchema,
  updateTournamentStatusSchema,
  addTournamentParticipantSchema,
  updateTournamentMatchScoreSchema,
  deleteTournamentSchema,
} from "@/lib/validation";
import type {
  CreateTournamentInput,
  UpdateTournamentStatusInput,
  AddParticipantInput,
  UpdateMatchScoreInput,
} from "@/lib/tournament-types";

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

  // Validate input with Zod
  const validationResult = createTournamentSchema.safeParse({
    groupId,
    name,
    format: format as "americano" | "round_robin" | "bracket",
    startDate,
    scoringSystem: scoringSystem as "standard_21" | "custom",
    courtCount,
    participantIds,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    throw new Error(errorMessage);
  }

  const validatedData = validationResult.data;

  // Create tournament via RPC
  const { data: tournament, error } = await supabaseServer.rpc("create_tournament", {
    p_group_id: validatedData.groupId,
    p_name: validatedData.name,
    p_format: validatedData.format,
    p_start_date: validatedData.startDate,
    p_scoring_system: validatedData.scoringSystem,
    p_court_count: validatedData.courtCount,
    p_participant_ids: validatedData.participantIds,
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

  // Validate input with Zod
  const validationResult = updateTournamentStatusSchema.safeParse({
    tournamentId,
    status: status as "upcoming" | "in_progress" | "completed",
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    throw new Error(errorMessage);
  }

  const { error } = await supabaseServer.rpc("update_tournament_status", {
    p_tournament_id: validationResult.data.tournamentId,
    p_status: validationResult.data.status,
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
  const seedPositionStr = String(formData.get("seed_position") ?? "").trim();
  const seedPosition = seedPositionStr ? parseInt(seedPositionStr, 10) : undefined;

  // Validate input with Zod
  const validationResult = addTournamentParticipantSchema.safeParse({
    tournamentId,
    playerId,
    seedPosition,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    throw new Error(errorMessage);
  }

  const { error } = await supabaseServer.rpc("add_tournament_participant", {
    p_tournament_id: validationResult.data.tournamentId,
    p_player_id: validationResult.data.playerId,
    p_seed_position: validationResult.data.seedPosition ?? null,
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

  // Validate input with Zod
  const validationResult = updateTournamentMatchScoreSchema.safeParse({
    tournamentMatchId,
    team1Games,
    team2Games,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    throw new Error(errorMessage);
  }

  const { error } = await supabaseServer.rpc("update_match_score", {
    p_tournament_match_id: validationResult.data.tournamentMatchId,
    p_team1_games: validationResult.data.team1Games,
    p_team2_games: validationResult.data.team2Games,
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

  // Validate input with Zod
  const validationResult = deleteTournamentSchema.safeParse({
    tournamentId,
    groupId: groupId || undefined,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    throw new Error(errorMessage);
  }

  // Delete tournament (cascade will handle related records)
  const { error } = await supabaseServer
    .from("tournaments")
    .delete()
    .eq("id", validationResult.data.tournamentId);

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
