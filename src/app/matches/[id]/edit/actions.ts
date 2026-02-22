"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const isValidSetScore = (team1: number, team2: number) => {
  const valid =
    (team1 === 6 && team2 >= 0 && team2 <= 4) ||
    (team2 === 6 && team1 >= 0 && team1 <= 4) ||
    (team1 === 7 && (team2 === 5 || team2 === 6)) ||
    (team2 === 7 && (team1 === 5 || team1 === 6));
  return valid;
};

/**
 * Build redirect URL with toast notification params
 */
function redirectWithToast(path: string, type: "success" | "error", message: string): string {
  const url = new URL(path, "http://dummy.com");
  url.searchParams.set("toast", type);
  url.searchParams.set("message", encodeURIComponent(message));
  return url.pathname + url.search;
}

export async function updateMatch(formData: FormData) {
  const supabaseServer = await createSupabaseServerClient();
  const matchId = String(formData.get("match_id") ?? "").trim();
  const groupId = String(formData.get("group_id") ?? "").trim();
  const groupSlug = String(formData.get("group_slug") ?? "").trim();
  const date = String(formData.get("played_date") ?? "").trim();
  const time = String(formData.get("played_time") ?? "").trim();
  const bestOf = Number(formData.get("best_of") ?? 3);
  const updatedBy = String(formData.get("updated_by") ?? "").trim();
  const mvpPlayerIdRaw = String(formData.get("mvp_player_id") ?? "").trim();

  const team1Player1 = String(formData.get("team1_player1") ?? "").trim();
  const team1Player2 = String(formData.get("team1_player2") ?? "").trim();
  const team2Player1 = String(formData.get("team2_player1") ?? "").trim();
  const team2Player2 = String(formData.get("team2_player2") ?? "").trim();

  if (!matchId || !groupId || !groupSlug || !date || !time || !updatedBy) {
    throw new Error("Faltan datos obligatorios del partido.");
  }
  if (![3, 5].includes(bestOf)) {
    throw new Error("El mejor de debe ser 3 o 5.");
  }

  const players = [
    team1Player1,
    team1Player2,
    team2Player1,
    team2Player2,
  ].filter(Boolean);
  if (players.length !== 4) {
    throw new Error("Cada equipo debe tener dos jugadores.");
  }
  const uniquePlayers = new Set(players);
  if (uniquePlayers.size !== 4) {
    throw new Error("Los jugadores deben ser únicos entre equipos.");
  }

  const mvpPlayerId = mvpPlayerIdRaw || null;
  if (mvpPlayerId && !uniquePlayers.has(mvpPlayerId)) {
    throw new Error("El MVP debe ser uno de los jugadores del partido.");
  }

  const requiredSets = Math.floor(bestOf / 2) + 1;
  const setScores: { setNumber: number; team1: number; team2: number }[] = [];
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

    if (Number.isNaN(team1Score) || Number.isNaN(team2Score)) {
      throw new Error(`Set ${i} debe tener puntajes válidos.`);
    }
    if (!isValidSetScore(team1Score, team2Score)) {
      throw new Error(`Set ${i} tiene un marcador inválido.`);
    }

    setScores.push({ setNumber: i, team1: team1Score, team2: team2Score });
  }

  if (setScores.length < requiredSets) {
    throw new Error("El partido está incompleto. Cargá todos los sets jugados.");
  }

  const team1Wins = setScores.reduce(
    (acc, set) => acc + (set.team1 > set.team2 ? 1 : 0),
    0
  );
  const team2Wins = setScores.reduce(
    (acc, set) => acc + (set.team2 > set.team1 ? 1 : 0),
    0
  );

  if (team1Wins < requiredSets && team2Wins < requiredSets) {
    throw new Error("El partido debe incluir el set ganador.");
  }
  if (setScores.length !== team1Wins + team2Wins) {
    throw new Error("Hay sets de más luego de completar el partido.");
  }

  const playedAt = new Date(`${date}T${time}`).toISOString();

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

  redirect(redirectWithToast(`/g/${groupSlug}/matches/${matchId}`, "success", "Partido actualizado correctamente"));
}
