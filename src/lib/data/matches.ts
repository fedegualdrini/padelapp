// src/lib/data/matches.ts - Match-related data functions
import { createSupabaseServerClient } from "@/lib/supabase/server";

const getSupabaseServerClient = async () => createSupabaseServerClient();

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));

type MatchRow = {
  id: string;
  played_at: string;
  best_of: number;
  created_by: string;
  updated_by?: string | null;
  predicted_win_prob?: number | null;
  prediction_factors?: PredictionFactors | null;
  prediction_correct?: boolean | null;
  match_teams: {
    team_number: number;
    match_team_players: { players: { id: string; name: string } | null }[];
  }[];
  sets: {
    set_number: number;
    set_scores: { team1_games: number; team2_games: number } | null;
  }[];
};

type PredictionFactors = {
  elo_difference: number;
  recent_form_team1: number;
  recent_form_team2: number;
  head_to_head?: {
    team1_wins: number;
    team2_wins: number;
    total_matches: number;
  };
  [key: string]: unknown;
};

const buildMatchView = (match: MatchRow) => {
  const teamsSorted = [...(match.match_teams ?? [])].sort(
    (a, b) => a.team_number - b.team_number
  );

  const teamPlayers = teamsSorted.map((team) => {
    const players =
      team.match_team_players
        ?.map((mtp) => mtp.players)
        .filter((p): p is { id: string; name: string } => Boolean(p?.id) && Boolean(p?.name)) ??
      [];

    const name = players.map((p) => p.name).join(" / ") || `Equipo ${team.team_number}`;

    return { name, players };
  });

  const setsSorted = [...(match.sets ?? [])].sort(
    (a, b) => a.set_number - b.set_number
  );

  const team1Sets: number[] = [];
  const team2Sets: number[] = [];
  setsSorted.forEach((set) => {
    if (!set.set_scores) return;
    team1Sets.push(set.set_scores.team1_games);
    team2Sets.push(set.set_scores.team2_games);
  });

  const team1SetWins = team1Sets.reduce(
    (acc, score, idx) => acc + (score > (team2Sets[idx] ?? 0) ? 1 : 0),
    0
  );
  const team2SetWins = team2Sets.reduce(
    (acc, score, idx) => acc + (score > (team1Sets[idx] ?? 0) ? 1 : 0),
    0
  );

  const winner =
    team1SetWins === team2SetWins
      ? "Pendiente"
      : team1SetWins > team2SetWins
      ? teamPlayers[0]?.name ?? "Equipo 1"
      : teamPlayers[1]?.name ?? "Equipo 2";

  return {
    id: match.id,
    playedAt: formatDate(match.played_at),
    bestOf: match.best_of,
    createdBy: match.created_by,
    updatedBy: match.updated_by ?? match.created_by,
    teams: [
      {
        name: teamPlayers[0]?.name ?? "Team 1",
        players: teamPlayers[0]?.players ?? [],
        sets: team1Sets,
        opponentSets: team2Sets,
      },
      {
        name: teamPlayers[1]?.name ?? "Team 2",
        players: teamPlayers[1]?.players ?? [],
        sets: team2Sets,
        opponentSets: team1Sets,
      },
    ] as const,
    winner,
  };
};

export async function getRecentMatches(groupId: string, limit = 3) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("matches")
    .select(
      `
        id,
        played_at,
        best_of,
        created_by,
        updated_by,
        match_teams (
          team_number,
          match_team_players (
            players ( id, name )
          )
        ),
        sets (
          set_number,
          set_scores ( team1_games, team2_games )
        )
      `
    )
    .eq("group_id", groupId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as unknown as MatchRow[]).map(buildMatchView);
}

export async function getMatches(
  groupId: string,
  filters?: { playerId?: string; from?: string; to?: string }
) {
  const supabaseServer = await getSupabaseServerClient();

  let matchIds: string[] | null = null;
  if (filters?.playerId) {
    const { data: mtp, error: mtpError } = await supabaseServer
      .from('match_team_players')
      .select('match_team_id')
      .eq('player_id', filters.playerId);

    if (mtpError) return [];

    const matchTeamIds = Array.from(
      new Set(
        (mtp as Array<{ match_team_id: string | null }> | null | undefined)
          ?.map((r) => r.match_team_id)
          .filter((id): id is string => Boolean(id)) ??
          []
      )
    );

    if (matchTeamIds.length === 0) return [];

    const { data: mts, error: mtsError } = await supabaseServer
      .from('match_teams')
      .select('match_id')
      .in('id', matchTeamIds);

    if (mtsError) return [];

    matchIds = Array.from(
      new Set(
        (mts as Array<{ match_id: string | null }> | null | undefined)
          ?.map((r) => r.match_id)
          .filter((id): id is string => Boolean(id)) ??
          []
      )
    );

    if (matchIds.length === 0) return [];
  }

  let query = supabaseServer
    .from("matches")
    .select(
      `
        id,
        played_at,
        best_of,
        created_by,
        updated_by,
        predicted_win_prob,
        prediction_factors,
        prediction_correct,
        match_teams (
          team_number,
          match_team_players (
            players ( id, name )
          )
        ),
        sets (
          set_number,
          set_scores ( team1_games, team2_games )
        )
      `
    )
    .eq("group_id", groupId);

  if (filters?.from) {
    query = query.gte('played_at', `${filters.from}T00:00:00.000Z`);
  }

  if (filters?.to) {
    query = query.lte('played_at', `${filters.to}T23:59:59.999Z`);
  }

  if (matchIds) {
    query = query.in('id', matchIds);
  }

  const { data, error } = await query.order("played_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as MatchRow[]).map(buildMatchView);
}

export async function getMatchById(groupId: string, id: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("matches")
    .select(
      `
        id,
        played_at,
        best_of,
        created_by,
        updated_by,
        predicted_win_prob,
        prediction_factors,
        prediction_correct,
        match_teams (
          team_number,
          match_team_players (
            players ( id, name )
          )
        ),
        sets (
          set_number,
          set_scores ( team1_games, team2_games )
        )
      `
    )
    .eq("id", id)
    .eq("group_id", groupId)
    .single();

  if (error || !data) {
    return null;
  }

  return buildMatchView(data as unknown as MatchRow);
}

export async function getMatchEloDeltas(matchId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data: teams, error: teamsError } = await supabaseServer
    .from("match_teams")
    .select("id")
    .eq("match_id", matchId);

  if (teamsError || !teams || teams.length === 0) {
    return [];
  }

  const teamIds = teams.map((team) => team.id);

  const [
    { data: matchPlayers, error: playersError },
    { data: matchRatings, error: ratingsError },
  ] = await Promise.all([
    supabaseServer
      .from("match_team_players")
      .select(`player_id, players ( name )`)
      .in("match_team_id", teamIds),
    supabaseServer
      .from("elo_ratings")
      .select("player_id, rating")
      .eq("as_of_match_id", matchId),
  ]);

  if (playersError || !matchPlayers || ratingsError || !matchRatings) {
    return [];
  }

  const ratingsByPlayer = new Map(
    matchRatings.map((row) => [row.player_id, row.rating])
  );

  const deltas = await Promise.all(
    matchPlayers.map(async (row) => {
      const player = (Array.isArray(row.players)
        ? row.players[0]
        : row.players) as { name: string } | null;
      const current = ratingsByPlayer.get(row.player_id);
      if (!player || current === undefined) {
        return null;
      }
      const { data: prev, error: prevError } = await supabaseServer.rpc(
        "get_player_elo_before",
        {
          p_player_id: row.player_id,
          p_match_id: matchId,
        }
      );
      if (prevError) {
        return null;
      }
      const previous = Number(prev ?? 1000);
      return {
        playerId: row.player_id,
        name: player.name,
        previous,
        current,
        delta: current - previous,
      };
    })
  );

  return deltas.filter(Boolean) as {
    playerId: string;
    name: string;
    previous: number;
    current: number;
    delta: number;
  }[];
}
