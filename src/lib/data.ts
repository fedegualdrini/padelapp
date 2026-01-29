import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Group = { id: string; name: string; slug: string };
type PlayerRow = { id: string; name: string; status: string };

type MatchRow = {
  id: string;
  played_at: string;
  best_of: number;
  created_by: string;
  updated_by?: string | null;
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
  updated_by?: string | null;
  mvp_player_id?: string | null;
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

  const teamPlayers = teamsSorted.map((team) => {
    const players =
      team.match_team_players
        ?.map((mtp) => mtp.players)
        .filter((p): p is { id: string; name: string } => Boolean(p?.id) && Boolean(p?.name)) ??
      [];

    const name = players.map((p) => p.name).join(" / ") || `Equipo ${team.team_number}`;

    return {
      name,
      players,
    };
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

  // If filtering by player, resolve match IDs via match_team_players -> match_teams.
  let matchIds: string[] | null = null;
  if (filters?.playerId) {
    const { data: mtp, error: mtpError } = await supabaseServer
      .from('match_team_players')
      .select('match_team_id')
      .eq('player_id', filters.playerId);

    if (mtpError) {
      // Fail closed: return empty rather than showing wrong results.
      return [];
    }

    const matchTeamIds = Array.from(
      new Set(
        (mtp as Array<{ match_team_id: string | null }> | null | undefined)
          ?.map((r) => r.match_team_id)
          .filter((id): id is string => Boolean(id)) ??
          []
      )
    );

    if (matchTeamIds.length === 0) {
      return [];
    }

    const { data: mts, error: mtsError } = await supabaseServer
      .from('match_teams')
      .select('match_id')
      .in('id', matchTeamIds);

    if (mtsError) {
      return [];
    }

    matchIds = Array.from(
      new Set(
        (mts as Array<{ match_id: string | null }> | null | undefined)
          ?.map((r) => r.match_id)
          .filter((id): id is string => Boolean(id)) ??
          []
      )
    );

    if (matchIds.length === 0) {
      return [];
    }
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
    // played_at is timestamptz; date string works as inclusive lower bound.
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
      .select(
        `
          player_id,
          players ( name )
        `
      )
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
        mvp_player_id,
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
    mvpPlayerId: match.mvp_player_id ?? null,
    teamPlayers,
    setScores,
  };
}

export const getPlayers = cache(async (groupId: string) => {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("players")
    .select("id, name, status")
    .eq("group_id", groupId)
    .order("name");

  if (error || !data) {
    return [];
  }

  return data as PlayerRow[];
});

export async function getPlayerStats(
  groupId: string,
  startDate?: string,
  endDate?: string
) {
  const supabaseServer = await getSupabaseServerClient();

  // If no date filter, use the materialized view for better performance
  if (!startDate && !endDate) {
    const { data, error } = await supabaseServer
      .from("mv_player_stats_v2")
      .select("player_id, matches_played, wins, losses, undecided, win_rate")
      .eq("group_id", groupId);

    if (error || !data) {
      return [];
    }

    return data;
  }

  // With date filter, calculate stats on-the-fly from the enriched view
  let query = supabaseServer
    .from("v_player_match_participation_enriched")
    .select("player_id, is_win")
    .eq("group_id", groupId);

  if (startDate) {
    query = query.gte("played_at", `${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    query = query.lte("played_at", `${endDate}T23:59:59.999Z`);
  }

  const { data: matches, error } = await query;

  if (error || !matches) {
    return [];
  }

  // Group by player and calculate stats
  const statsByPlayer = new Map<
    string,
    {
      player_id: string;
      matches_played: number;
      wins: number;
      losses: number;
      undecided: number;
      win_rate: number;
    }
  >();

  matches.forEach((match) => {
    const existing = statsByPlayer.get(match.player_id) ?? {
      player_id: match.player_id,
      matches_played: 0,
      wins: 0,
      losses: 0,
      undecided: 0,
      win_rate: 0,
    };

    existing.matches_played += 1;

    if (match.is_win === true) {
      existing.wins += 1;
    } else if (match.is_win === false) {
      existing.losses += 1;
    } else {
      existing.undecided += 1;
    }

    const totalDecided = existing.wins + existing.losses;
    existing.win_rate =
      totalDecided > 0 ? existing.wins / totalDecided : 0;

    statsByPlayer.set(match.player_id, existing);
  });

  return Array.from(statsByPlayer.values());
}

export async function getPairAggregates(
  groupId: string,
  players?: PlayerRow[],
  startDate?: string,
  endDate?: string
) {
  const supabaseServer = await getSupabaseServerClient();
  const resolvedPlayers = players ?? (await getPlayers(groupId));
  if (resolvedPlayers.length === 0) {
    return [];
  }
  const playerIds = new Set(resolvedPlayers.map((player) => player.id));

  // If no date filter, use the materialized view for better performance
  if (!startDate && !endDate) {
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

  // With date filter, query directly from mv_pair_stats and join with matches
  let query = supabaseServer
    .from("mv_pair_stats")
    .select(`
      player_a_id,
      player_b_id,
      is_win,
      matches!inner(played_at, group_id)
    `)
    .eq("matches.group_id", groupId);

  if (startDate) {
    query = query.gte("matches.played_at", `${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    query = query.lte("matches.played_at", `${endDate}T23:59:59.999Z`);
  }

  const { data: pairMatches, error } = await query;

  if (error || !pairMatches) {
    return [];
  }

  // Group by pair and calculate stats
  const statsByPair = new Map<
    string,
    {
      group_id: string;
      player_a_id: string;
      player_b_id: string;
      matches_played: number;
      wins: number;
      losses: number;
      win_rate: number;
    }
  >();

  pairMatches.forEach((pm) => {
    const pairKey = `${pm.player_a_id}-${pm.player_b_id}`;
    const existing = statsByPair.get(pairKey) ?? {
      group_id: groupId,
      player_a_id: pm.player_a_id,
      player_b_id: pm.player_b_id,
      matches_played: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
    };

    existing.matches_played += 1;

    if (pm.is_win) {
      existing.wins += 1;
    } else {
      existing.losses += 1;
    }

    existing.win_rate =
      existing.matches_played > 0
        ? existing.wins / existing.matches_played
        : 0;

    statsByPair.set(pairKey, existing);
  });

  return Array.from(statsByPair.values())
    .filter(
      (pair) =>
        playerIds.has(pair.player_a_id) && playerIds.has(pair.player_b_id)
    )
    .sort((a, b) => b.matches_played - a.matches_played);
}

export async function getUsualPairs(groupId: string, limit = 6) {
  const players = await getPlayers(groupId);
  const pairs = await getPairAggregates(groupId, players);
  const playerMap = new Map(
    players.map((player) => [player.id, player])
  );

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
  const players = await getPlayers(groupId);
  const [playerStats, pairStats, eloRatingsResult, inviteMostPlayed] =
    await Promise.all([
      getPlayerStats(groupId),
      getPairAggregates(groupId, players),
      supabaseServer
        .from("elo_ratings")
        .select("player_id, rating, matches(played_at)")
        .order("played_at", { foreignTable: "matches", ascending: true })
        .order("created_at", { ascending: true }),
      getInviteMostPlayed(groupId, players),
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

export async function getInviteMostPlayed(
  groupId: string,
  players?: PlayerRow[]
) {
  const supabaseServer = await getSupabaseServerClient();
  const resolvedPlayers = players ?? (await getPlayers(groupId));
  const playerIds = new Set(resolvedPlayers.map((player) => player.id));
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

type EloTimelinePoint = { date: string; rating: number };
type EloTimelineSeries = {
  playerId: string;
  name: string;
  status: string;
  points: EloTimelinePoint[];
};

type EloRatingRow = {
  player_id: string;
  rating: number;
  created_at: string;
  matches: { played_at?: string; group_id?: string } | null;
};

export async function getEloTimeline(
  groupId: string,
  startDate?: string,
  endDate?: string
) {
  const supabaseServer = await getSupabaseServerClient();

  let query = supabaseServer
    .from("elo_ratings")
    .select("player_id, rating, created_at, matches(played_at, group_id)")
    .eq("matches.group_id", groupId);

  if (startDate) {
    query = query.gte("matches.played_at", `${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    query = query.lte("matches.played_at", `${endDate}T23:59:59.999Z`);
  }

  const [players, ratingsResult] = await Promise.all([
    getPlayers(groupId),
    query
      .order("played_at", { foreignTable: "matches", ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const seriesByPlayer = new Map<string, EloTimelineSeries>();
  players.forEach((player) => {
    seriesByPlayer.set(player.id, {
      playerId: player.id,
      name: player.name,
      status: player.status,
      points: [],
    });
  });

  if (!ratingsResult.error && ratingsResult.data) {
    (ratingsResult.data as unknown as EloRatingRow[]).forEach((row) => {
      const playedAt = row.matches?.played_at;
      if (!playedAt) return;
      const target = seriesByPlayer.get(row.player_id);
      if (!target) return;
      target.points.push({ date: playedAt, rating: row.rating });
    });
  }

  return Array.from(seriesByPlayer.values());
}

export async function getPlayerEloChange(
  groupId: string,
  playerId: string,
  startDate?: string,
  endDate?: string
) {
  const supabaseServer = await getSupabaseServerClient();

  let query = supabaseServer
    .from("elo_ratings")
    .select("player_id, rating, created_at, matches(played_at, group_id)")
    .eq("player_id", playerId)
    .eq("matches.group_id", groupId);

  if (startDate) {
    query = query.gte("matches.played_at", `${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    query = query.lte("matches.played_at", `${endDate}T23:59:59.999Z`);
  }

  const { data, error } = await query
    .order("played_at", { foreignTable: "matches", ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return { startElo: null, endElo: null, change: null };
  }

  const ratings = data as unknown as EloRatingRow[];
  const startElo = ratings[0].rating;
  const endElo = ratings[ratings.length - 1].rating;

  return {
    startElo,
    endElo,
    change: endElo - startElo,
  };
}

export type PlayerForm = {
  playerId: string;
  name: string;
  recentMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  eloChange: number;
  streak: {
    type: "win" | "loss";
    count: number;
  } | null;
  formIndicator: "hot" | "neutral" | "cold";
};

export async function getPlayerRecentForm(
  groupId: string,
  playerId: string,
  matchCount: number = 10
): Promise<PlayerForm | null> {
  const supabaseServer = await getSupabaseServerClient();

  // Get player info
  const { data: player, error: playerError } = await supabaseServer
    .from("players")
    .select("id, name")
    .eq("id", playerId)
    .eq("group_id", groupId)
    .single();

  if (playerError || !player) {
    return null;
  }

  // Get recent matches with results
  // NOTE: We query an enriched view instead of joining `v_player_match_results` -> matches,
  // because PostgREST can't infer relationships from a plain view.
  const { data: matchResults, error: matchError } = await supabaseServer
    .from("v_player_match_results_enriched")
    .select("match_id, player_id, is_win, played_at")
    .eq("player_id", playerId)
    .eq("group_id", groupId)
    .order("played_at", { ascending: false })
    .limit(matchCount);

  if (matchError || !matchResults || matchResults.length === 0) {
    return {
      playerId: player.id,
      name: player.name,
      recentMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      eloChange: 0,
      streak: null,
      formIndicator: "neutral",
    };
  }

  // Calculate wins/losses
  const wins = matchResults.filter((r) => r.is_win).length;
  const losses = matchResults.length - wins;
  const winRate = matchResults.length > 0 ? wins / matchResults.length : 0;

  // Get ELO ratings for first and last match in the window
  const matchIds = matchResults.map((r) => r.match_id);
  const firstMatchId = matchIds[matchIds.length - 1];
  const lastMatchId = matchIds[0];

  const { data: eloData, error: eloError } = await supabaseServer
    .from("elo_ratings")
    .select("player_id, rating, as_of_match_id")
    .eq("player_id", playerId)
    .in("as_of_match_id", [firstMatchId, lastMatchId]);

  let eloChange = 0;
  if (!eloError && eloData && eloData.length >= 2) {
    const firstElo = eloData.find((r) => r.as_of_match_id === firstMatchId)?.rating ?? 1000;
    const lastElo = eloData.find((r) => r.as_of_match_id === lastMatchId)?.rating ?? 1000;
    eloChange = lastElo - firstElo;
  }

  // Calculate current streak
  let streak: { type: "win" | "loss"; count: number } | null = null;
  if (matchResults.length > 0) {
    const currentStreakType = matchResults[0].is_win ? "win" : "loss";
    let streakCount = 1;
    for (let i = 1; i < matchResults.length; i++) {
      if (
        (currentStreakType === "win" && matchResults[i].is_win) ||
        (currentStreakType === "loss" && !matchResults[i].is_win)
      ) {
        streakCount++;
      } else {
        break;
      }
    }
    streak = { type: currentStreakType, count: streakCount };
  }

  // Determine form indicator
  let formIndicator: "hot" | "neutral" | "cold" = "neutral";
  if (matchResults.length >= 3) {
    if (winRate >= 0.6 && eloChange >= 0) {
      formIndicator = "hot";
    } else if (winRate <= 0.4 && eloChange <= 0) {
      formIndicator = "cold";
    }
  }

  return {
    playerId: player.id,
    name: player.name,
    recentMatches: matchResults.length,
    wins,
    losses,
    winRate,
    eloChange,
    streak,
    formIndicator,
  };
}

export type StreakHistoryItem = {
  streak: number;
  type: "win" | "loss";
  startMatchId: string;
  endMatchId: string;
  startDate: string;
  endDate: string;
};

export type PlayerStreaks = {
  currentStreak: number; // positive for wins, negative for losses, 0 for neutral
  longestWinStreak: number;
  longestLossStreak: number;
  streakHistory: StreakHistoryItem[];
};

export async function getPlayerStreaks(
  groupId: string,
  playerId: string
): Promise<PlayerStreaks> {
  const supabaseServer = await getSupabaseServerClient();

  // Get all matches for the player in chronological order (oldest first)
  const { data: matchResults, error } = await supabaseServer
    .from("v_player_match_results_enriched")
    .select("match_id, is_win, played_at")
    .eq("player_id", playerId)
    .eq("group_id", groupId)
    .order("played_at", { ascending: true });

  if (error || !matchResults || matchResults.length === 0) {
    return {
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      streakHistory: [],
    };
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  const streakHistory: StreakHistoryItem[] = [];

  let currentStreakType: "win" | "loss" | null = null;
  let currentStreakCount = 0;
  let currentStreakStart: { matchId: string; date: string } | null = null;

  for (let i = 0; i < matchResults.length; i++) {
    const match = matchResults[i];
    const isWin = match.is_win;

    if (currentStreakType === null) {
      // First match
      currentStreakType = isWin ? "win" : "loss";
      currentStreakCount = 1;
      currentStreakStart = { matchId: match.match_id, date: match.played_at };
    } else if (
      (currentStreakType === "win" && isWin) ||
      (currentStreakType === "loss" && !isWin)
    ) {
      // Streak continues
      currentStreakCount++;
    } else {
      // Streak broken - save the completed streak
      if (currentStreakStart && currentStreakCount >= 2) {
        streakHistory.push({
          streak: currentStreakCount,
          type: currentStreakType,
          startMatchId: currentStreakStart.matchId,
          endMatchId: matchResults[i - 1].match_id,
          startDate: currentStreakStart.date,
          endDate: matchResults[i - 1].played_at,
        });
      }

      // Update longest streaks
      if (currentStreakType === "win") {
        longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
      } else {
        longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
      }

      // Start new streak
      currentStreakType = isWin ? "win" : "loss";
      currentStreakCount = 1;
      currentStreakStart = { matchId: match.match_id, date: match.played_at };
    }
  }

  // Handle the final streak
  if (currentStreakStart && currentStreakCount > 0 && currentStreakType) {
    const lastMatch = matchResults[matchResults.length - 1];

    // Update longest streaks
    if (currentStreakType === "win") {
      longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
    } else {
      longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
    }

    // Set current streak (positive for wins, negative for losses)
    currentStreak = currentStreakType === "win" ? currentStreakCount : -currentStreakCount;

    // Add to history if significant streak
    if (currentStreakCount >= 2) {
      streakHistory.push({
        streak: currentStreakCount,
        type: currentStreakType,
        startMatchId: currentStreakStart.matchId,
        endMatchId: lastMatch.match_id,
        startDate: currentStreakStart.date,
        endDate: lastMatch.played_at,
      });
    }
  }

  return {
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    streakHistory,
  };
}

export type MatchPrediction = {
  team1: {
    playerIds: [string, string];
    playerNames: [string, string];
    avgElo: number;
    winProbability: number;
  };
  team2: {
    playerIds: [string, string];
    playerNames: [string, string];
    avgElo: number;
    winProbability: number;
  };
  predictedWinner: 1 | 2;
  confidence: "low" | "medium" | "high";
};

export async function predictMatchOutcome(
  groupId: string,
  team1PlayerIds: [string, string],
  team2PlayerIds: [string, string]
): Promise<MatchPrediction | null> {
  const supabaseServer = await getSupabaseServerClient();

  // Get current ELO for all 4 players
  const allPlayerIds = [...team1PlayerIds, ...team2PlayerIds];

  const [playersResult, ratingsResult] = await Promise.all([
    supabaseServer
      .from("players")
      .select("id, name")
      .eq("group_id", groupId)
      .in("id", allPlayerIds),
    supabaseServer
      .from("elo_ratings")
      .select("player_id, rating, created_at")
      .in("player_id", allPlayerIds)
      .order("created_at", { ascending: false }),
  ]);

  if (playersResult.error || !playersResult.data) {
    return null;
  }

  if (ratingsResult.error || !ratingsResult.data) {
    return null;
  }

  // Get latest ELO for each player
  const latestEloByPlayer = new Map<string, number>();
  ratingsResult.data.forEach((row) => {
    if (!latestEloByPlayer.has(row.player_id)) {
      latestEloByPlayer.set(row.player_id, row.rating);
    }
  });

  // Get player names
  const playerNamesById = new Map(
    playersResult.data.map((p) => [p.id, p.name])
  );

  // Calculate team averages (default to 1000 if no ELO history)
  const team1Elos = team1PlayerIds.map((id) => latestEloByPlayer.get(id) ?? 1000);
  const team2Elos = team2PlayerIds.map((id) => latestEloByPlayer.get(id) ?? 1000);

  const team1AvgElo = (team1Elos[0] + team1Elos[1]) / 2;
  const team2AvgElo = (team2Elos[0] + team2Elos[1]) / 2;

  // Calculate win probabilities using ELO formula
  // Expected score = 1 / (1 + 10^((opponentElo - playerElo) / 400))
  const team1WinProb = 1 / (1 + Math.pow(10, (team2AvgElo - team1AvgElo) / 400));
  const team2WinProb = 1 - team1WinProb;

  // Determine predicted winner
  const predictedWinner: 1 | 2 = team1WinProb > team2WinProb ? 1 : 2;

  // Determine confidence level based on probability spread
  const probDiff = Math.abs(team1WinProb - team2WinProb);
  let confidence: "low" | "medium" | "high" = "medium";
  if (probDiff < 0.2) {
    confidence = "low";
  } else if (probDiff > 0.4) {
    confidence = "high";
  }

  return {
    team1: {
      playerIds: team1PlayerIds,
      playerNames: [
        playerNamesById.get(team1PlayerIds[0]) ?? "Unknown",
        playerNamesById.get(team1PlayerIds[1]) ?? "Unknown",
      ],
      avgElo: Math.round(team1AvgElo),
      winProbability: team1WinProb,
    },
    team2: {
      playerIds: team2PlayerIds,
      playerNames: [
        playerNamesById.get(team2PlayerIds[0]) ?? "Unknown",
        playerNamesById.get(team2PlayerIds[1]) ?? "Unknown",
      ],
      avgElo: Math.round(team2AvgElo),
      winProbability: team2WinProb,
    },
    predictedWinner,
    confidence,
  };
}

export type HeadToHeadStats = {
  playerA: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
  };
  playerB: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
  };
  totalMatches: number;
  matches: Array<{
    id: string;
    playedAt: string;
    winner: string;
    playerATeam: string[];
    playerBTeam: string[];
    score: string;
  }>;
};

export async function getPlayerById(groupId: string, playerId: string) {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("players")
    .select("id, name, status")
    .eq("id", playerId)
    .eq("group_id", groupId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as PlayerRow;
}

export type PartnerStat = {
  partnerId: string;
  partnerName: string;
  partnerStatus: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
};

export async function getPlayerPartnerStats(
  groupId: string,
  playerId: string
): Promise<PartnerStat[]> {
  const supabaseServer = await getSupabaseServerClient();

  // Get all players in the group for name resolution
  const players = await getPlayers(groupId);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Find all matches where the player participated
  const { data: playerMatches, error: matchError } = await supabaseServer
    .from("match_team_players")
    .select(
      `
      match_team_id,
      match_teams!inner (
        match_id,
        team_number,
        match_team_players!inner (
          player_id
        )
      )
    `
    )
    .eq("player_id", playerId);

  if (matchError || !playerMatches || playerMatches.length === 0) {
    return [];
  }

  // Build partner stats
  const partnerStats = new Map<
    string,
    { wins: number; losses: number; matches: number }
  >();

  for (const row of playerMatches) {
    const matchTeam = Array.isArray(row.match_teams)
      ? row.match_teams[0]
      : row.match_teams;
    if (!matchTeam?.match_id) continue;

    // Get teammates for this match
    const teammates = Array.isArray(matchTeam.match_team_players)
      ? matchTeam.match_team_players
      : [matchTeam.match_team_players];

    const partnerRow = teammates.find((t: { player_id: string }) => t.player_id !== playerId);
    if (!partnerRow) continue;

    const partnerId = partnerRow.player_id;

    // Get match result to determine win/loss
    const { data: matchResult, error: resultError } = await supabaseServer
      .from("v_player_match_results")
      .select("is_win")
      .eq("match_id", matchTeam.match_id)
      .eq("player_id", playerId)
      .single();

    if (resultError || !matchResult) continue;

    const stats = partnerStats.get(partnerId) || { wins: 0, losses: 0, matches: 0 };
    stats.matches++;
    if (matchResult.is_win) {
      stats.wins++;
    } else {
      stats.losses++;
    }
    partnerStats.set(partnerId, stats);
  }

  // Convert to array and sort by matches played
  return Array.from(partnerStats.entries())
    .map(([partnerId, stats]) => {
      const partner = playerMap.get(partnerId);
      return {
        partnerId,
        partnerName: partner?.name ?? "Unknown",
        partnerStatus: partner?.status ?? "usual",
        matchesPlayed: stats.matches,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.matches > 0 ? stats.wins / stats.matches : 0,
      };
    })
    .sort((a, b) => b.matchesPlayed - a.matchesPlayed)
    .slice(0, 5);
}

export type RecentMatch = {
  id: string;
  playedAt: string;
  opponentTeam: string;
  partnerName: string | null;
  result: "win" | "loss";
  score: string;
};

export async function getPlayerRecentMatches(
  groupId: string,
  playerId: string,
  limit: number = 10
): Promise<RecentMatch[]> {
  const supabaseServer = await getSupabaseServerClient();

  // Get recent matches with results using the enriched view
  const { data: matchResults, error } = await supabaseServer
    .from("v_player_match_results_enriched")
    .select("match_id, is_win, played_at")
    .eq("player_id", playerId)
    .eq("group_id", groupId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error || !matchResults || matchResults.length === 0) {
    return [];
  }

  const matches: RecentMatch[] = [];

  for (const result of matchResults) {
    // Get match details
    const { data: matchData, error: matchError } = await supabaseServer
      .from("matches")
      .select(
        `
        id,
        played_at,
        match_teams (
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
      .eq("id", result.match_id)
      .eq("group_id", groupId)
      .single();

    if (matchError || !matchData) continue;

    // Find which team the player was on
    let partnerName: string | null = null;
    const opponentTeamNames: string[] = [];

    for (const team of matchData.match_teams || []) {
      const teamPlayers = Array.isArray(team.match_team_players)
        ? team.match_team_players
        : [team.match_team_players];

      const playerOnTeam = teamPlayers.find(
        (tp: { player_id: string }) => tp.player_id === playerId
      );

      if (playerOnTeam) {
        // Find partner
        const partner = teamPlayers.find(
          (tp: { player_id: string }) => tp.player_id !== playerId
        );
        if (partner?.players) {
          const playerData = Array.isArray(partner.players)
            ? partner.players[0]
            : partner.players;
          partnerName = playerData?.name ?? null;
        }
      } else {
        // This is the opponent team
        for (const tp of teamPlayers) {
          if (tp.players) {
            const playerData = Array.isArray(tp.players)
              ? tp.players[0]
              : tp.players;
            if (playerData?.name) {
              opponentTeamNames.push(playerData.name);
            }
          }
        }
      }
    }

    // Calculate score
    const sets = Array.isArray(matchData.sets) ? matchData.sets : [];
    const sortedSets = sets.sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number);

    const setScores: string[] = [];

    for (const set of sortedSets) {
      const scores = Array.isArray(set.set_scores)
        ? set.set_scores[0]
        : set.set_scores;
      if (scores) {
        const t1Games = scores.team1_games;
        const t2Games = scores.team2_games;
        setScores.push(`${t1Games}-${t2Games}`);
      }
    }

    const playedAt = new Date(matchData.played_at).toLocaleDateString("es-AR", {
      month: "short",
      day: "2-digit",
    });

    matches.push({
      id: matchData.id,
      playedAt,
      opponentTeam: opponentTeamNames.join(" / ") || "Unknown",
      partnerName,
      result: result.is_win ? "win" : "loss",
      score: setScores.join(", ") || "Sin resultado",
    });
  }

  return matches;
}

export async function getHeadToHeadStats(
  groupId: string,
  playerAId: string,
  playerBId: string
): Promise<HeadToHeadStats | null> {
  const supabaseServer = await getSupabaseServerClient();

  // Get player names
  const { data: players, error: playersError } = await supabaseServer
    .from("players")
    .select("id, name")
    .eq("group_id", groupId)
    .in("id", [playerAId, playerBId]);

  if (playersError || !players || players.length !== 2) {
    return null;
  }

  const playerAName = players.find((p) => p.id === playerAId)?.name ?? "Unknown";
  const playerBName = players.find((p) => p.id === playerBId)?.name ?? "Unknown";

  // Find matches where both players participated on opposing teams
  const { data: matchData, error: matchError } = await supabaseServer
    .from("match_team_players")
    .select(
      `
      match_team_id,
      player_id,
      match_teams!inner (
        match_id,
        team_number,
        matches!inner (
          id,
          played_at,
          group_id,
          sets (
            set_number,
            set_scores ( team1_games, team2_games )
          )
        )
      )
    `
    )
    .eq("match_teams.matches.group_id", groupId)
    .in("player_id", [playerAId, playerBId]);

  if (matchError || !matchData) {
    return {
      playerA: { id: playerAId, name: playerAName, wins: 0, losses: 0, setsWon: 0, setsLost: 0 },
      playerB: { id: playerBId, name: playerBName, wins: 0, losses: 0, setsWon: 0, setsLost: 0 },
      totalMatches: 0,
      matches: [],
    };
  }

  // Group by match to find matches where they were opponents
  const matchesByMatchId = new Map<
    string,
    Array<{ playerId: string; teamNumber: number }>
  >();

  matchData.forEach((row) => {
    const matchTeam = Array.isArray(row.match_teams) ? row.match_teams[0] : row.match_teams;
    if (!matchTeam?.match_id) return;

    const matchId = matchTeam.match_id;
    if (!matchesByMatchId.has(matchId)) {
      matchesByMatchId.set(matchId, []);
    }
    matchesByMatchId.get(matchId)!.push({
      playerId: row.player_id,
      teamNumber: matchTeam.team_number,
    });
  });

  // Filter for matches where they were on different teams
  const opponentMatches: string[] = [];
  matchesByMatchId.forEach((teamData, matchId) => {
    const playerATeam = teamData.find((t) => t.playerId === playerAId)?.teamNumber;
    const playerBTeam = teamData.find((t) => t.playerId === playerBId)?.teamNumber;

    if (playerATeam && playerBTeam && playerATeam !== playerBTeam) {
      opponentMatches.push(matchId);
    }
  });

  if (opponentMatches.length === 0) {
    return {
      playerA: { id: playerAId, name: playerAName, wins: 0, losses: 0, setsWon: 0, setsLost: 0 },
      playerB: { id: playerBId, name: playerBName, wins: 0, losses: 0, setsWon: 0, setsLost: 0 },
      totalMatches: 0,
      matches: [],
    };
  }

  // Get full match details
  const matches = await getMatches(groupId);
  const h2hMatches = matches.filter((m) => opponentMatches.includes(m.id));

  // Calculate stats
  let playerAWins = 0;
  let playerBWins = 0;
  let playerASetsWon = 0;
  let playerBSetsWon = 0;

  const matchDetails = h2hMatches.map((match) => {
    const teamData = matchesByMatchId.get(match.id)!;
    const playerATeamNum = teamData.find((t) => t.playerId === playerAId)!.teamNumber;
    const playerBTeamNum = teamData.find((t) => t.playerId === playerBId)!.teamNumber;

    const team1SetWins = match.teams[0].sets.filter(
      (s, i) => s > match.teams[0].opponentSets[i]
    ).length;
    const team2SetWins = match.teams[1].sets.filter(
      (s, i) => s > match.teams[1].opponentSets[i]
    ).length;

    const playerAWon =
      (playerATeamNum === 1 && team1SetWins > team2SetWins) ||
      (playerATeamNum === 2 && team2SetWins > team1SetWins);

    if (playerAWon) {
      playerAWins++;
      playerASetsWon += playerATeamNum === 1 ? team1SetWins : team2SetWins;
      playerBSetsWon += playerBTeamNum === 1 ? team1SetWins : team2SetWins;
    } else {
      playerBWins++;
      playerBSetsWon += playerBTeamNum === 1 ? team1SetWins : team2SetWins;
      playerASetsWon += playerATeamNum === 1 ? team1SetWins : team2SetWins;
    }

    const scoreStr = match.teams
      .map((t) =>
        t.sets.map((s, i) => `${s}-${t.opponentSets[i]}`).join(", ")
      )
      .join(" | ");

    return {
      id: match.id,
      playedAt: match.playedAt,
      winner: playerAWon ? playerAName : playerBName,
      playerATeam: [match.teams[playerATeamNum - 1].name],
      playerBTeam: [match.teams[playerBTeamNum - 1].name],
      score: scoreStr,
    };
  });

  return {
    playerA: {
      id: playerAId,
      name: playerAName,
      wins: playerAWins,
      losses: playerBWins,
      setsWon: playerASetsWon,
      setsLost: playerBSetsWon,
    },
    playerB: {
      id: playerBId,
      name: playerBName,
      wins: playerBWins,
      losses: playerAWins,
      setsWon: playerBSetsWon,
      setsLost: playerASetsWon,
    },
    totalMatches: opponentMatches.length,
    matches: matchDetails,
  };
}

// Event/Attendance related types and functions
type WeeklyEvent = {
  id: string;
  group_id: string;
  name: string;
  weekday: number;
  start_time: string;
  capacity: number;
  cutoff_weekday: number;
  cutoff_time: string;
  is_active: boolean;
  active_occurrence_id: string | null;
  created_at: string;
  updated_at: string;
};

type EventOccurrence = {
  id: string;
  weekly_event_id: string;
  group_id: string;
  starts_at: string;
  status: 'open' | 'locked' | 'cancelled' | 'completed';
  loaded_match_id: string | null;
  created_at: string;
  updated_at: string;
};

type AttendanceRecord = {
  id: string;
  occurrence_id: string;
  group_id: string;
  player_id: string;
  status: 'confirmed' | 'declined' | 'maybe' | 'waitlist';
  source: 'whatsapp' | 'web' | 'admin';
  created_at: string;
  updated_at: string;
  players?: { id: string; name: string } | null;
};

export async function getWeeklyEvents(groupId: string): Promise<WeeklyEvent[]> {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("weekly_events")
    .select("*")
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as WeeklyEvent[];
}

export async function getUpcomingOccurrences(
  groupId: string,
  limit = 6
): Promise<EventOccurrence[]> {
  const supabaseServer = await getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from("event_occurrences")
    .select("*")
    .eq("group_id", groupId)
    .gte("starts_at", now)
    .in("status", ['open', 'locked'])
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as EventOccurrence[];
}

export async function getPastOccurrences(
  groupId: string,
  limit = 10
): Promise<EventOccurrence[]> {
  const supabaseServer = await getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from("event_occurrences")
    .select("*")
    .eq("group_id", groupId)
    .lt("starts_at", now)
    .in("status", ['completed', 'cancelled', 'open', 'locked'])
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as EventOccurrence[];
}

export async function getAttendanceForOccurrence(
  occurrenceId: string
): Promise<AttendanceRecord[]> {
  const supabaseServer = await getSupabaseServerClient();
  const { data, error } = await supabaseServer
    .from("attendance")
    .select("*, players(id, name)")
    .eq("occurrence_id", occurrenceId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as AttendanceRecord[];
}

export async function getCurrentUserPlayerId(groupId: string): Promise<string | null> {
  const supabaseServer = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Check if there's a player linked to this user in the group
  // First, check group_members to get any existing mapping
  const { data: member, error: memberError } = await supabaseServer
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    return null;
  }

  // Try to find a player with matching user_id or check via other means
  // For now, return the first player with the user's email or name match
  // This is a simplified approach - in production you'd have a proper user->player mapping
  const { data: players, error: playersError } = await supabaseServer
    .from("players")
    .select("id")
    .eq("group_id", groupId)
    .limit(1);

  if (playersError || !players || players.length === 0) {
    return null;
  }

  // Return the first player's ID as a fallback
  // In a real implementation, you'd have a proper user->player mapping table
  return players[0].id;
}

export async function isGroupAdmin(groupId: string): Promise<boolean> {
  const supabaseServer = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return false;
  }

  // Check if there's a group_admins entry for this user
  // We need to join through players or have a direct mapping
  // For now, check if user email matches an admin pattern or if there's an entry in group_admins
  const { data: admin, error: adminError } = await supabaseServer
    .from("group_admins")
    .select("player_id")
    .eq("group_id", groupId)
    .maybeSingle();

  if (adminError || !admin) {
    return false;
  }

  // Check if the current user is linked to this player
  // This requires a user_id column in players or a mapping table
  // For now, we'll use a simplified check - first player in the group is considered admin
  return true;
}

export type AttendanceSummary = {
  occurrence: EventOccurrence;
  weeklyEvent: WeeklyEvent;
  attendance: AttendanceRecord[];
  confirmedCount: number;
  declinedCount: number;
  maybeCount: number;
  waitlistCount: number;
  isFull: boolean;
  spotsAvailable: number;
};

export async function getAttendanceSummary(
  groupId: string,
  occurrences: EventOccurrence[],
  weeklyEvents: WeeklyEvent[]
): Promise<AttendanceSummary[]> {
  const weeklyEventMap = new Map(weeklyEvents.map(we => [we.id, we]));

  const summaries = await Promise.all(
    occurrences.map(async (occurrence) => {
      const attendance = await getAttendanceForOccurrence(occurrence.id);
      const weeklyEvent = weeklyEventMap.get(occurrence.weekly_event_id);
      const capacity = weeklyEvent?.capacity ?? 4;

      const confirmedCount = attendance.filter(a => a.status === 'confirmed').length;
      const declinedCount = attendance.filter(a => a.status === 'declined').length;
      const maybeCount = attendance.filter(a => a.status === 'maybe').length;
      const waitlistCount = attendance.filter(a => a.status === 'waitlist').length;

      return {
        occurrence,
        weeklyEvent: weeklyEvent ?? {
          id: '',
          group_id: groupId,
          name: 'Evento',
          weekday: 0,
          start_time: '20:00',
          capacity: 4,
          cutoff_weekday: 2,
          cutoff_time: '14:00',
          is_active: true,
          active_occurrence_id: null,
          created_at: '',
          updated_at: '',
        },
        attendance,
        confirmedCount,
        declinedCount,
        maybeCount,
        waitlistCount,
        isFull: confirmedCount >= capacity,
        spotsAvailable: Math.max(0, capacity - confirmedCount),
      };
    })
  );

  return summaries;
}

export type PlayerWithElo = {
  id: string;
  name: string;
  elo: number;
};

export async function getConfirmedPlayersWithElo(
  occurrenceId: string
): Promise<PlayerWithElo[]> {
  const supabaseServer = await getSupabaseServerClient();

  // Get confirmed players for the occurrence
  const { data: attendance, error: attendanceError } = await supabaseServer
    .from("attendance")
    .select("player_id, players(id, name)")
    .eq("occurrence_id", occurrenceId)
    .eq("status", "confirmed");

  if (attendanceError || !attendance || attendance.length === 0) {
    return [];
  }

  const playerIds: string[] = [];
  const players: { id: string; name: string }[] = [];

  attendance.forEach((a) => {
    playerIds.push(a.player_id);
    
    // Extract player name from the joined players relation
    let playerName = "Unknown";
    if (a.players) {
      if (Array.isArray(a.players)) {
        playerName = a.players[0]?.name || "Unknown";
      } else {
        // Type assertion to bypass TypeScript control flow limitation
        const playerObj = a.players as { id: string; name: string };
        playerName = playerObj.name || "Unknown";
      }
    }

    players.push({
      id: a.player_id,
      name: playerName,
    });
  });

  if (playerIds.length === 0) {
    return [];
  }

  // Get latest ELO rating for each player
  const { data: ratings, error: ratingsError } = await supabaseServer
    .from("elo_ratings")
    .select("player_id, rating, created_at")
    .in("player_id", playerIds)
    .order("created_at", { ascending: false });

  if (ratingsError || !ratings) {
    // Return players with default ELO of 1000
    return players.map((p) => ({ id: p.id, name: p.name, elo: 1000 }));
  }

  // Get the latest ELO for each player
  const latestEloByPlayer = new Map<string, number>();
  ratings.forEach((row) => {
    if (!latestEloByPlayer.has(row.player_id)) {
      latestEloByPlayer.set(row.player_id, row.rating);
    }
  });

  return players.map((p) => ({
    id: p.id,
    name: p.name,
    elo: latestEloByPlayer.get(p.id) ?? 1000,
  }));
}

export type SuggestedTeams = {
  teamA: PlayerWithElo[];
  teamB: PlayerWithElo[];
  teamAElo: number;
  teamBElo: number;
};

export function balanceTeams(players: PlayerWithElo[]): SuggestedTeams {
  // Sort players by ELO (descending)
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  // Simple balancing algorithm: pair highest with lowest
  // Team A: [0], [3]
  // Team B: [1], [2]
  const teamA = [sortedPlayers[0], sortedPlayers[3]];
  const teamB = [sortedPlayers[1], sortedPlayers[2]];

  const teamAElo = teamA.reduce((sum, p) => sum + p.elo, 0);
  const teamBElo = teamB.reduce((sum, p) => sum + p.elo, 0);

  return {
    teamA,
    teamB,
    teamAElo,
    teamBElo,
  };
}
