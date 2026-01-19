import { createSupabaseServerClient } from "@/lib/supabase/server";

type Group = { id: string; name: string; slug: string };

type MatchRow = {
  id: string;
  played_at: string;
  best_of: number;
  created_by: string;
  match_teams: {
    team_number: number;
    match_team_players: { players: { id: string; name: string } | null }[];
  }[];
  sets: {
    set_number: number;
    set_scores: { team1_games: number; team2_games: number } | null;
  }[];
};

type MatchEditRow = {
  id: string;
  played_at: string;
  best_of: number;
  created_by: string;
  match_teams: {
    team_number: number;
    id: string;
    match_team_players: { player_id: string; players: { name: string } | null }[];
  }[];
  sets: {
    set_number: number;
    set_scores: { team1_games: number; team2_games: number } | null;
  }[];
};

const getSupabaseServerClient = async () => createSupabaseServerClient();

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

export async function getGroupBySlug(slug: string) {
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
}

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

  // Get the current user
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return false;
  }

  // Check if this specific user is a member of the group
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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const buildMatchView = (match: MatchRow) => {
  const teamsSorted = [...(match.match_teams ?? [])].sort(
    (a, b) => a.team_number - b.team_number
  );

  const teamNames = teamsSorted.map((team) => {
    const names =
      team.match_team_players
        ?.map((mtp) => mtp.players?.name)
        .filter(Boolean) ?? [];
    return names.join(" / ") || `Equipo ${team.team_number}`;
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
      ? teamNames[0] ?? "Equipo 1"
      : teamNames[1] ?? "Equipo 2";

  return {
    id: match.id,
    playedAt: formatDate(match.played_at),
    bestOf: match.best_of,
    createdBy: match.created_by,
    teams: [
      {
        name: teamNames[0] ?? "Team 1",
        sets: team1Sets,
        opponentSets: team2Sets,
      },
      {
        name: teamNames[1] ?? "Team 2",
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

export async function getMatches(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("matches")
    .select(
      `
        id,
        played_at,
        best_of,
        created_by,
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
    .order("played_at", { ascending: false });

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

  const { data: matchPlayers, error: playersError } = await supabaseServer
    .from("match_team_players")
    .select(
      `
        player_id,
        players ( name )
      `
    )
    .in("match_team_id", teamIds);

  if (playersError || !matchPlayers) {
    return [];
  }

  const { data: matchRatings, error: ratingsError } = await supabaseServer
    .from("elo_ratings")
    .select("player_id, rating")
    .eq("as_of_match_id", matchId);

  if (ratingsError || !matchRatings) {
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

export async function getMatchEditData(groupId: string, id: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("matches")
    .select(
      `
        id,
        played_at,
        best_of,
        created_by,
        match_teams (
          id,
          team_number,
          match_team_players (
            player_id,
            players ( name )
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

  const match = data as unknown as MatchEditRow;
  const playedAt = new Date(match.played_at);
  const date = playedAt.toISOString().slice(0, 10);
  const time = playedAt.toISOString().slice(11, 16);

  const teamsSorted = [...(match.match_teams ?? [])].sort(
    (a, b) => a.team_number - b.team_number
  );

  const teamPlayers = teamsSorted.map((team) =>
    team.match_team_players.map((mtp) => mtp.player_id)
  );

  const setsSorted = [...(match.sets ?? [])].sort(
    (a, b) => a.set_number - b.set_number
  );
  const setScores = setsSorted.map((set) => ({
    setNumber: set.set_number,
    team1: set.set_scores?.team1_games ?? null,
    team2: set.set_scores?.team2_games ?? null,
  }));

  return {
    id: match.id,
    date,
    time,
    bestOf: match.best_of,
    createdBy: match.created_by,
    teamPlayers,
    setScores,
  };
}

export async function getPlayers(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("players")
    .select("id, name, status")
    .eq("group_id", groupId)
    .order("name");

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getPlayerStats(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("mv_player_stats")
    .select("player_id, wins, losses, win_rate")
    .eq("group_id", groupId);

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getPairAggregates(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const players = await getPlayers(groupId);
  const playerIds = new Set(players.map((player) => player.id));
  const { data, error } = await supabaseServer
    .from("mv_pair_aggregates")
    .select(
      "group_id, player_a_id, player_b_id, matches_played, wins, losses, win_rate"
    )
    .eq("group_id", groupId)
    .order("matches_played", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.filter(
    (pair) =>
      playerIds.has(pair.player_a_id) && playerIds.has(pair.player_b_id)
  );
}

export async function getUsualPairs(groupId: string, limit = 6) {
  const supabaseServer = await getSupabaseServerClient();
  const [pairs, players] = await Promise.all([
    getPairAggregates(groupId),
    getPlayers(groupId),
  ]);
  const playerMap = new Map(players.map((player) => [player.id, player]));

  return pairs
    .map((pair) => {
      const playerA = playerMap.get(pair.player_a_id);
      const playerB = playerMap.get(pair.player_b_id);
      if (!playerA || !playerB) return null;
      if (playerA.status !== "usual" || playerB.status !== "usual") return null;
      return {
        playerAId: pair.player_a_id,
        playerBId: pair.player_b_id,
        label: `${playerA.name} / ${playerB.name}`,
        matches: pair.matches_played,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.matches ?? 0) - (a?.matches ?? 0))
    .slice(0, limit)
    .map((pair) => ({
      playerAId: pair!.playerAId,
      playerBId: pair!.playerBId,
      label: pair!.label,
    }));
}

export async function getPulseStats(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabaseServer
    .from("matches")
    .select(
      `
        id,
        played_at,
        sets (
          set_number,
          set_scores ( team1_games, team2_games )
        )
      `
    )
    .eq("group_id", groupId)
    .gte("played_at", since.toISOString());

  if (error || !data) {
    return { matches: 0, sets: 0, games: 0 };
  }

  const matches = data.length;
  let sets = 0;
  let games = 0;

  data.forEach((match) => {
    const matchSets = match.sets ?? [];
    sets += matchSets.length;
    matchSets.forEach((set) => {
      const setScores = Array.isArray(set.set_scores)
        ? set.set_scores[0]
        : set.set_scores;
      if (!setScores) return;
      games += setScores.team1_games + setScores.team2_games;
    });
  });

  return { matches, sets, games };
}

export async function getTopStats(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const [playerStats, pairStats, eloRatingsResult, players, inviteMostPlayed] =
    await Promise.all([
      getPlayerStats(groupId),
      getPairAggregates(groupId),
      supabaseServer
        .from("elo_ratings")
        .select("player_id, rating, matches(played_at)")
        .order("played_at", { foreignTable: "matches", ascending: true })
        .order("created_at", { ascending: true }),
      getPlayers(groupId),
      getInviteMostPlayed(groupId),
    ]);

  const playerById = new Map(players.map((p) => [p.id, p.name]));
  const playerIds = new Set(players.map((p) => p.id));
  const mostWins = [...playerStats].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0))[0];
  const bestWinRate = [...playerStats].sort(
    (a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0)
  )[0];
  const mostPlayedPair = pairStats[0];

  const ratingsByPlayer = new Map<string, { first: number; last: number }>();

  if (eloRatingsResult.data && !eloRatingsResult.error) {
    eloRatingsResult.data.forEach((row) => {
      if (!playerIds.has(row.player_id)) return;
      const playedAt = (row as { matches?: { played_at?: string } }).matches
        ?.played_at;
      if (!playedAt) return;
      const year = new Date(playedAt).getFullYear();
      if (year !== new Date().getFullYear()) return;
      const entry = ratingsByPlayer.get(row.player_id) ?? {
        first: row.rating,
        last: row.rating,
      };
      entry.last = row.rating;
      ratingsByPlayer.set(row.player_id, entry);
    });
  }

  let mostImproved: { name: string; delta: number } | null = null;
  ratingsByPlayer.forEach((value, playerId) => {
    const delta = value.last - value.first;
    if (delta <= 0) return;
    if (!mostImproved || delta > mostImproved.delta) {
      mostImproved = { name: playerById.get(playerId) ?? "Unknown", delta };
    }
  });

  const mostImprovedEntry = mostImproved as { name: string; delta: number } | null;

  return [
    {
      label: "Más victorias",
      value: mostWins ? playerById.get(mostWins.player_id) ?? "-" : "-",
      sub: mostWins ? `${mostWins.wins} victorias` : "Sin partidos",
    },
    {
      label: "Mejor porcentaje",
      value: bestWinRate ? playerById.get(bestWinRate.player_id) ?? "-" : "-",
      sub: bestWinRate
        ? `${Math.round((bestWinRate.win_rate ?? 0) * 100)}%`
        : "Sin partidos",
    },
    {
      label: "Más mejoró",
      value: mostImprovedEntry?.name ?? "-",
      sub: mostImprovedEntry
        ? `+${mostImprovedEntry.delta} ELO`
        : "Sin mejoras",
    },
    {
      label: "Pareja más jugada",
      value: mostPlayedPair
        ? `${playerById.get(mostPlayedPair.player_a_id) ?? "-"} / ${
            playerById.get(mostPlayedPair.player_b_id) ?? "-"
          }`
        : "-",
      sub: mostPlayedPair
        ? `${mostPlayedPair.matches_played} partidos`
        : "Sin parejas",
    },
    {
      label: "Invitado top",
      value: inviteMostPlayed?.name ?? "-",
      sub: inviteMostPlayed
        ? `${inviteMostPlayed.matches} partidos`
        : "Sin partidos con invitados",
    },
  ];
}

export async function getInviteMostPlayed(groupId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const players = await getPlayers(groupId);
  const playerIds = new Set(players.map((player) => player.id));
  const { data, error } = await supabaseServer
    .from("v_player_match_results")
    .select(
      `
        player_id,
        players ( name, status )
      `
    );

  if (error || !data) {
    return null;
  }

  const counts = new Map<string, number>();
  const names = new Map<string, string>();
  data.forEach((row) => {
    if (!playerIds.has(row.player_id)) return;
    const player = (Array.isArray(row.players)
      ? row.players[0]
      : row.players) as { name: string; status: string } | null;
    if (!player || player.status !== "invite") return;
    counts.set(row.player_id, (counts.get(row.player_id) ?? 0) + 1);
    names.set(row.player_id, player.name);
  });

  let bestId: string | null = null;
  let bestCount = 0;
  counts.forEach((count, playerId) => {
    if (count > bestCount) {
      bestCount = count;
      bestId = playerId;
    }
  });

  if (!bestId) return null;

  return { playerId: bestId, name: names.get(bestId) ?? "-", matches: bestCount };
}

export async function getEloLeaderboard(groupId: string, limit = 8) {
  const supabaseServer = await getSupabaseServerClient();
  const [players, ratingsResult] = await Promise.all([
    getPlayers(groupId),
    supabaseServer
      .from("elo_ratings")
      .select("player_id, rating, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (ratingsResult.error || !ratingsResult.data) {
    return [];
  }

  const playerById = new Map(players.map((player) => [player.id, player.name]));
  const latestByPlayer = new Map<string, number>();

  const playerIds = new Set(players.map((player) => player.id));
  ratingsResult.data.forEach((row) => {
    if (!playerIds.has(row.player_id)) return;
    if (!latestByPlayer.has(row.player_id)) {
      latestByPlayer.set(row.player_id, row.rating);
    }
  });

  return Array.from(latestByPlayer.entries())
    .map(([playerId, rating]) => ({
      playerId,
      name: playerById.get(playerId) ?? "-",
      rating,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}
