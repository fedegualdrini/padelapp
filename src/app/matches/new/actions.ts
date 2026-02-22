"use server";

// (removed) previously used next/server.after
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { calculateMatchPrediction } from "./prediction-actions";
import { autoCloseEventsForMatch } from "@/lib/data";
import { setScoreSchema, uuidSchema, matchBestOfSchema, dateStringSchema, timeStringSchema } from "@/lib/validation";

type CreateMatchState = {
  error?: string | null;
};

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
 * Validate match input data comprehensively
 */
function validateMatchInput(data: {
  groupId: string;
  groupSlug: string;
  createdBy: string;
  playedDate: string;
  playedTime: string;
  bestOf: number;
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  mvpPlayerId?: string;
}): string | null {
  // Validate group ID
  const groupIdResult = uuidSchema.safeParse(data.groupId);
  if (!groupIdResult.success) {
    return "ID de grupo inválido";
  }

  // Validate created by
  const createdByResult = uuidSchema.safeParse(data.createdBy);
  if (!createdByResult.success) {
    return "ID de creador inválido";
  }

  // Validate date
  const dateResult = dateStringSchema.safeParse(data.playedDate);
  if (!dateResult.success) {
    return dateResult.error.issues[0]?.message || "Formato de fecha inválido";
  }

  // Validate time
  const timeResult = timeStringSchema.safeParse(data.playedTime);
  if (!timeResult.success) {
    return timeResult.error.issues[0]?.message || "Formato de hora inválido";
  }

  // Validate best of
  const bestOfResult = matchBestOfSchema.safeParse(data.bestOf);
  if (!bestOfResult.success) {
    return bestOfResult.error.issues[0]?.message || "El mejor de debe ser 3 o 5";
  }

  // Validate player IDs
  const playerIds = [data.team1Player1, data.team1Player2, data.team2Player1, data.team2Player2];
  for (const playerId of playerIds) {
    const playerResult = uuidSchema.safeParse(playerId);
    if (!playerResult.success) {
      return "ID de jugador inválido";
    }
  }

  // Check unique players
  const uniquePlayers = new Set(playerIds);
  if (uniquePlayers.size !== 4) {
    return "Los jugadores deben ser únicos entre equipos";
  }

  // Validate MVP if provided
  if (data.mvpPlayerId) {
    const mvpResult = uuidSchema.safeParse(data.mvpPlayerId);
    if (!mvpResult.success) {
      return "ID de MVP inválido";
    }
    if (!uniquePlayers.has(data.mvpPlayerId)) {
      return "El MVP debe ser uno de los jugadores del partido";
    }
  }

  return null;
}

export async function createMatch(
  _prevState: CreateMatchState,
  formData: FormData
): Promise<CreateMatchState> {
  // Rate limit check
  await assertRateLimit("match");

  const supabaseServer = await createSupabaseServerClient();
  
  // Extract all input data
  const groupId = String(formData.get("group_id") ?? "").trim();
  const groupSlug = String(formData.get("group_slug") ?? "").trim();
  const createdBy = String(formData.get("created_by") ?? "").trim();
  const playedDate = String(formData.get("played_date") ?? "").trim();
  const playedTime = String(formData.get("played_time") ?? "").trim();
  const bestOf = Number(formData.get("best_of") ?? 3);
  const team1Player1 = String(formData.get("team1_player1") ?? "").trim();
  const team1Player2 = String(formData.get("team1_player2") ?? "").trim();
  const team2Player1 = String(formData.get("team2_player1") ?? "").trim();
  const team2Player2 = String(formData.get("team2_player2") ?? "").trim();
  const mvpPlayerId = String(formData.get("mvp_player_id") ?? "").trim();

  // Basic required field check
  if (!groupId || !groupSlug || !createdBy) {
    return { error: "Faltan datos obligatorios del partido." };
  }

  if (!playedDate || !playedTime) {
    return { error: "La fecha y hora son obligatorias." };
  }

  // Comprehensive input validation
  const validationError = validateMatchInput({
    groupId,
    groupSlug,
    createdBy,
    playedDate,
    playedTime,
    bestOf,
    team1Player1,
    team1Player2,
    team2Player1,
    team2Player2,
    mvpPlayerId: mvpPlayerId || undefined,
  });

  if (validationError) {
    return { error: validationError };
  }

  // Extract and validate set scores
  let setScores;
  try {
    setScores = extractAndValidateSetScores(formData, bestOf);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    throw error;
  }

  const team1Wins = setScores.reduce(
    (acc, set) => acc + (set.team1 > set.team2 ? 1 : 0),
    0
  );
  const team2Wins = setScores.reduce(
    (acc, set) => acc + (set.team2 > set.team1 ? 1 : 0),
    0
  );

  if (team1Wins < bestOf && team2Wins < bestOf) {
    return { error: "El partido debe incluir el set ganador." };
  }
  if (setScores.length !== team1Wins + team2Wins) {
    return { error: "Hay sets de más luego de completar el partido." };
  }

  const playedAt = new Date(`${playedDate}T${playedTime}`).toISOString();

  const { data: match, error: matchError } = await supabaseServer
    .from("matches")
    .insert({
      group_id: groupId,
      played_at: playedAt,
      best_of: bestOf,
      created_by: createdBy,
      updated_by: createdBy,
      mvp_player_id: mvpPlayerId || null,
    })
    .select("id")
    .single();

  if (matchError || !match) {
    return { error: "No se pudo crear el partido." };
  }

  const { data: teams, error: teamsError } = await supabaseServer
    .from("match_teams")
    .insert(
      [
        { match_id: match.id, team_number: 1, updated_by: createdBy },
        { match_id: match.id, team_number: 2, updated_by: createdBy },
      ],
      { defaultToNull: false }
    )
    .select("id, team_number");

  if (teamsError || !teams) {
    return { error: "No se pudieron crear los equipos." };
  }

  const team1Id = teams.find((team) => team.team_number === 1)?.id;
  const team2Id = teams.find((team) => team.team_number === 2)?.id;

  if (!team1Id || !team2Id) {
    return { error: "Faltan equipos del partido." };
  }

  const { error: mtpError } = await supabaseServer
    .from("match_team_players")
    .insert([
      { match_team_id: team1Id, player_id: team1Player1, updated_by: createdBy },
      { match_team_id: team1Id, player_id: team1Player2, updated_by: createdBy },
      { match_team_id: team2Id, player_id: team2Player1, updated_by: createdBy },
      { match_team_id: team2Id, player_id: team2Player2, updated_by: createdBy },
    ]);

  if (mtpError) {
    return { error: "No se pudieron asignar jugadores a los equipos." };
  }

  const { data: sets, error: setsError } = await supabaseServer
    .from("sets")
    .insert(
      setScores.map((set) => ({
        match_id: match.id,
        set_number: set.setNumber,
        updated_by: createdBy,
      }))
    )
    .select("id, set_number");

  if (setsError || !sets) {
    return { error: "No se pudieron crear los sets." };
  }

  const setScoreRows = setScores
    .map((set) => {
      const setRow = sets.find((row) => row.set_number === set.setNumber);
      if (!setRow) return null;
      return {
        set_id: setRow.id,
        team1_games: set.team1,
        team2_games: set.team2,
        updated_by: createdBy,
      };
    })
    .filter(Boolean);

  if (setScoreRows.length === 0) {
    return { error: "No se pudieron guardar los marcadores de sets." };
  }

  const { error: scoresError } = await supabaseServer
    .from("set_scores")
    .insert(setScoreRows);

  if (scoresError) {
    return { error: "No se pudieron guardar los marcadores." };
  }

  // Calculate and store prediction
  try {
    const team1Ids = [team1Player1, team1Player2];
    const team2Ids = [team2Player1, team2Player2];
    const prediction = await calculateMatchPrediction(groupId, team1Ids, team2Ids);

    // Determine who won
    const predictedWinner = prediction.teamAWinProb > 0.5 ? 1 : 2;
    const actualWinner = team1Wins > team2Wins ? 1 : 2;
    const predictionCorrect = predictedWinner === actualWinner;

    // Update match with prediction data
    const { error: predictionError } = await supabaseServer
      .from("matches")
      .update({
        predicted_win_prob: prediction.teamAWinProb,
        prediction_factors: prediction as Record<string, unknown>,
        prediction_correct: predictionCorrect,
      })
      .eq("id", match.id);

    if (predictionError) {
      console.error("Failed to save prediction:", predictionError);
    }
  } catch (error) {
    console.error("Failed to calculate prediction:", error);
    // Don't fail the entire match creation if prediction fails
  }

  // Keep stats views in sync for pages that read from materialized views.
  // We await here to avoid UI showing stale counts (e.g. "-1 match") right after creation.
  const { error: refreshError } = await supabaseServer.rpc("refresh_stats_views");
  if (refreshError) {
    console.error("refresh_stats_views failed", { refreshError });
  }

  // Check achievements for all players in the match
  const playerIds = [team1Player1, team1Player2, team2Player1, team2Player2];
  for (const playerId of playerIds) {
    try {
      await supabaseServer.rpc('check_achievements', {
        p_group_id: groupId,
        p_player_id: playerId,
      });
      await supabaseServer.rpc('check_special_achievements', {
        p_group_id: groupId,
        p_player_id: playerId,
      });
    } catch (error) {
      console.error('Failed to check achievements for player:', playerId, error);
    }
  }

  // Update weekly challenges progress
  try {
    await supabaseServer.rpc('update_weekly_progress', {
      p_group_id: groupId,
      p_match_id: match.id,
    });
  } catch (error) {
    console.error('Failed to update weekly challenges progress:', error);
    // Don't fail the match creation if weekly challenges update fails
  }

  // Auto-close events when match is created with same 4 confirmed players
  try {
    const closedCount = await autoCloseEventsForMatch(groupId, playedAt, playerIds);
    if (closedCount > 0) {
      console.log(`Auto-closed ${closedCount} event(s) for match ${match.id}`);
    }
  } catch (error) {
    console.error('Failed to auto-close events for match:', error);
    // Don't fail the match creation if auto-close fails
  }

  redirect(`/g/${groupSlug}/matches/${match.id}`);
}
