"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { setScoreSchema, uuidSchema, matchBestOfSchema, dateStringSchema, timeStringSchema } from "@/lib/validation";

/**
 * Extract and validate set scores from form data
 */
function extractAndValidateSetScores(formData: FormData, bestOf: number): Array<{ setNumber: number; team1: number; team2: number }> {
  const requiredSets = Math.floor(bestOf / 2) + 1;
  const setScores: Array<{ setNumber: number; team1: number; team2: number }> = [];
  
  for (let i = 1; i <= 5; i += 1) {
    const team1ScoreRaw = formData.get(`set${i}_team1`);
    const team2ScoreRaw = formData.get(`set${i}_team2`);

    const team1Raw = team1ScoreRaw === null ? "" : String(team1ScoreRaw).trim();
    const team2Raw = team2ScoreRaw === null ? "" : String(team2ScoreRaw).trim();

    if (team1Raw === "" && team2Raw === "") {
      continue;
    }
    if (team1Raw === "" || team2Raw === "") {
      throw new Error(`Set ${i} debe tener ambos puntajes.`);
    }

    const team1Score = Number(team1Raw);
    const team2Score = Number(team2Raw);

    // Validate set score with Zod
    const validationResult = setScoreSchema.safeParse({ team1: team1Score, team2: team2Score });
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Puntaje inválido";
      throw new Error(`Set ${i}: ${errorMessage}`);
    }

    setScores.push({ setNumber: i, team1: team1Score, team2: team2Score });
  }

  if (setScores.length < requiredSets) {
    throw new Error("El partido está incompleto. Cargá todos los sets jugados.");
  }

  return setScores;
}

/**
 * Validate match update input data comprehensively
 */
function validateMatchUpdateInput(data: {
  matchId: string;
  groupId: string;
  groupSlug: string;
  updatedBy: string;
  playedDate: string;
  playedTime: string;
  bestOf: number;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  mvpPlayerId?: string | null;
}): void {
  // Validate match ID
  const matchIdResult = uuidSchema.safeParse(data.matchId);
  if (!matchIdResult.success) {
    throw new Error("ID de partido inválido");
  }

  // Validate group ID
  const groupIdResult = uuidSchema.safeParse(data.groupId);
  if (!groupIdResult.success) {
    throw new Error("ID de grupo inválido");
  }

  // Validate updated by
  const updatedByResult = uuidSchema.safeParse(data.updatedBy);
  if (!updatedByResult.success) {
    throw new Error("ID de actualizador inválido");
  }

  // Validate date
  const dateResult = dateStringSchema.safeParse(data.playedDate);
  if (!dateResult.success) {
    throw new Error(dateResult.error.issues[0]?.message || "Formato de fecha inválido");
  }

  // Validate time
  const timeResult = timeStringSchema.safeParse(data.playedTime);
  if (!timeResult.success) {
    throw new Error(timeResult.error.issues[0]?.message || "Formato de hora inválido");
  }

  // Validate best of
  const bestOfResult = matchBestOfSchema.safeParse(data.bestOf);
  if (!bestOfResult.success) {
    throw new Error(bestOfResult.error.issues[0]?.message || "El mejor de debe ser 3 o 5");
  }

  // Validate player IDs
  const playerIds = [data.team1Player1, data.team1Player2, data.team2Player1, data.team2Player2];
  for (const playerId of playerIds) {
    const playerResult = uuidSchema.safeParse(playerId);
    if (!playerResult.success) {
      throw new Error("ID de jugador inválido");
    }
  }

  // Check unique players
  const uniquePlayers = new Set(playerIds);
  if (uniquePlayers.size !== 4) {
    throw new Error("Los jugadores deben ser únicos entre equipos");
  }

  // Validate MVP if provided
  if (data.mvpPlayerId) {
    const mvpResult = uuidSchema.safeParse(data.mvpPlayerId);
    if (!mvpResult.success) {
      throw new Error("ID de MVP inválido");
    }
    if (!uniquePlayers.has(data.mvpPlayerId)) {
      throw new Error("El MVP debe ser uno de los jugadores del partido");
    }
  }
}

export async function updateMatch(formData: FormData) {
  // Rate limit check
  await assertRateLimit("match");

  const supabaseServer = await createSupabaseServerClient();
  
  // Extract all input data
  const matchId = String(formData.get("match_id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const groupSlug = String(formData.get("group_slug") ?? "").trim();
  const playedDate = String(formData.get("played_date") ?? "").trim();
  const playedTime = String(formData.get("played_time") ?? "").trim();
  const bestOf = Number(formData.get("best_of") ?? 3);
  const updatedBy = String(formData.get("updated_by") ?? "").trim();
  const mvpPlayerIdRaw = String(formData.get("mvp_player_id") ?? "").trim();

  const team1Player1 = String(formData.get("team1_player1") ?? "").trim();
  const team1Player2 = String(formData.get("team1_player2") ?? "").trim();
  const team2Player1 = String(formData.get("team2_player1") ?? "").trim();
  const team2Player2 = String(formData.get("team2_player2") ?? "").trim();

  // Basic required field check
  if (!matchId || !groupId || !groupSlug || !playedDate || !playedTime || !updatedBy) {
    throw new Error("Faltan datos obligatorios del partido.");
  }

  // Comprehensive input validation
  validateMatchUpdateInput({
    matchId,
    groupId,
    groupSlug,
    updatedBy,
    playedDate,
    playedTime,
    bestOf,
    team1Player1,
    team1Player2,
    team2Player1,
    team2Player2,
    mvpPlayerId: mvpPlayerIdRaw || null,
  });

  // Extract and validate set scores
  const setScores = extractAndValidateSetScores(formData, bestOf);

  const team1Wins = setScores.reduce(
    (acc, set) => acc + (set.team1 > set.team2 ? 1 : 0),
    0
  );
  const team2Wins = setScores.reduce(
    (acc, set) => acc + (set.team2 > set.team1 ? 1 : 0),
    0
  );

  if (team1Wins < bestOf && team2Wins < bestOf) {
    throw new Error("El partido debe incluir el set ganador.");
  }
  if (setScores.length !== team1Wins + team2Wins) {
    throw new Error("Hay sets de más luego de completar el partido.");
  }

  const playedAt = new Date(`${playedDate}T${playedTime}`).toISOString();
  const mvpPlayerId = mvpPlayerIdRaw || null;

  const { error: matchError } = await supabaseServer
    .from("matches")
    .update({
      group_id: groupId,
      played_at: playedAt,
      best_of: bestOf,
      updated_by: updatedBy,
      mvp_player_id: mvpPlayerId,
    })
    .eq("id", matchId);

  if (matchError) {
    throw new Error("No se pudo actualizar el partido.");
  }

  const { error: deleteTeamsError } = await supabaseServer
    .from("match_teams")
    .delete()
    .eq("match_id", matchId);

  if (deleteTeamsError) {
    throw new Error("No se pudieron reiniciar los equipos.");
  }

  const { data: teams, error: teamsError } = await supabaseServer
    .from("match_teams")
    .insert(
      [
        { match_id: matchId, team_number: 1, updated_by: updatedBy },
        { match_id: matchId, team_number: 2, updated_by: updatedBy },
      ],
      { defaultToNull: false }
    )
    .select("id, team_number");

  if (teamsError || !teams) {
    throw new Error("No se pudieron crear los equipos.");
  }

  const team1Id = teams.find((team) => team.team_number === 1)?.id;
  const team2Id = teams.find((team) => team.team_number === 2)?.id;

  if (!team1Id || !team2Id) {
    throw new Error("Faltan equipos del partido.");
  }

  const { error: mtpError } = await supabaseServer
    .from("match_team_players")
    .insert([
      { match_team_id: team1Id, player_id: team1Player1, updated_by: updatedBy },
      { match_team_id: team1Id, player_id: team1Player2, updated_by: updatedBy },
      { match_team_id: team2Id, player_id: team2Player1, updated_by: updatedBy },
      { match_team_id: team2Id, player_id: team2Player2, updated_by: updatedBy },
    ]);

  if (mtpError) {
    throw new Error("No se pudieron asignar jugadores a los equipos.");
  }

  const { error: deleteSetsError } = await supabaseServer
    .from("sets")
    .delete()
    .eq("match_id", matchId);

  if (deleteSetsError) {
    throw new Error("No se pudieron reiniciar los sets.");
  }

  const { data: sets, error: setsError } = await supabaseServer
    .from("sets")
    .insert(
      setScores.map((set) => ({
        match_id: matchId,
        set_number: set.setNumber,
        updated_by: updatedBy,
      }))
    )
    .select("id, set_number");

  if (setsError || !sets) {
    throw new Error("No se pudieron crear los sets.");
  }

  const setScoreRows = setScores
    .map((set) => {
      const setRow = sets.find((row) => row.set_number === set.setNumber);
      if (!setRow) return null;
      return {
        set_id: setRow.id,
        team1_games: set.team1,
        team2_games: set.team2,
        updated_by: updatedBy,
      };
    })
    .filter(Boolean);

  if (setScoreRows.length === 0) {
    throw new Error("No se pudieron guardar los marcadores de sets.");
  }

  const { error: scoresError } = await supabaseServer
    .from("set_scores")
    .insert(setScoreRows);

  if (scoresError) {
    throw new Error("No se pudieron guardar los marcadores.");
  }

  await supabaseServer.rpc("recompute_all_elo", { p_k: 32 });
  await supabaseServer.rpc("refresh_stats_views");

  redirect(`/g/${groupSlug}/matches/${matchId}`);
}
