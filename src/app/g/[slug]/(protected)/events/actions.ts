"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getGroupBySlug, isGroupMember, autoCloseEventsForMatch } from "@/lib/data";
import {
  createWeeklyEventSchema,
  updateWeeklyEventSchema,
  updateAttendanceSchema,
  createMatchFromOccurrenceSchema,
  uuidSchema,
  attendanceStatusSchema,
} from "@/lib/validation";
import { z } from "zod";

export type AttendanceStatus = 'confirmed' | 'declined' | 'maybe' | 'waitlist';

export async function updateAttendance(
  slug: string,
  occurrenceId: string,
  playerId: string,
  status: AttendanceStatus
) {
  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  // Validate inputs
  try {
    updateAttendanceSchema.parse({
      occurrenceId,
      playerId,
      status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0]?.message || "Error de validación");
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();

  // Check if attendance record already exists
  const { data: existing, error: checkError } = await supabase
    .from("attendance")
    .select("id")
    .eq("occurrence_id", occurrenceId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (checkError) {
    throw new Error(checkError.message);
  }

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from("attendance")
      .update({
        status,
        source: 'web',
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from("attendance")
      .insert({
        occurrence_id: occurrenceId,
        group_id: group.id,
        player_id: playerId,
        status,
        source: 'web',
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/g/${slug}/events`);
  revalidatePath(`/g/${slug}`);
}

export async function cancelOccurrence(slug: string, occurrenceId: string) {
  if (!hasSupabaseEnv() && slug === "demo") {
    return { ok: true };
  }

  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  // Validate occurrenceId
  try {
    uuidSchema.parse(occurrenceId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("ID de ocurrencia inválido");
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("event_occurrences")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", occurrenceId)
    .eq("group_id", group.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/events`);
  revalidatePath(`/g/${slug}`);
  return { ok: true };
}


export async function createWeeklyEvent(
  slug: string,
  data: {
    name: string;
    weekday: number;
    startTime: string;
    capacity: number;
    cutoffWeekday: number;
    cutoffTime: string;
  }
) {
  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  // Validate inputs
  let validatedData;
  try {
    validatedData = createWeeklyEventSchema.parse({
      name: data.name,
      weekday: data.weekday,
      startTime: data.startTime,
      capacity: data.capacity,
      cutoffWeekday: data.cutoffWeekday,
      cutoffTime: data.cutoffTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0]?.message || "Error de validación");
    }
    throw error;
  }

  // Check if user is admin
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  // For now, allow any member to create events (can be restricted later)
  const { error } = await supabase
    .from("weekly_events")
    .insert({
      group_id: group.id,
      name: validatedData.name,
      weekday: validatedData.weekday,
      start_time: validatedData.startTime,
      capacity: validatedData.capacity,
      cutoff_weekday: validatedData.cutoffWeekday,
      cutoff_time: validatedData.cutoffTime,
      is_active: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/events`);
}

export async function updateWeeklyEvent(
  slug: string,
  eventId: string,
  data: {
    name?: string;
    weekday?: number;
    startTime?: string;
    capacity?: number;
    cutoffWeekday?: number;
    cutoffTime?: string;
    isActive?: boolean;
  }
) {
  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  // Validate inputs (partial validation)
  let validatedData;
  try {
    validatedData = updateWeeklyEventSchema.parse({
      name: data.name,
      weekday: data.weekday,
      startTime: data.startTime,
      capacity: data.capacity,
      cutoffWeekday: data.cutoffWeekday,
      cutoffTime: data.cutoffTime,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0]?.message || "Error de validación");
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validatedData.name !== undefined) updateData.name = validatedData.name;
  if (validatedData.weekday !== undefined) updateData.weekday = validatedData.weekday;
  if (validatedData.startTime !== undefined) updateData.start_time = validatedData.startTime;
  if (validatedData.capacity !== undefined) updateData.capacity = validatedData.capacity;
  if (validatedData.cutoffWeekday !== undefined) updateData.cutoff_weekday = validatedData.cutoffWeekday;
  if (validatedData.cutoffTime !== undefined) updateData.cutoff_time = validatedData.cutoffTime;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { error } = await supabase
    .from("weekly_events")
    .update(updateData)
    .eq("id", eventId)
    .eq("group_id", group.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/events`);
}

export async function deleteWeeklyEvent(slug: string, eventId: string) {
  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  // Validate eventId
  try {
    uuidSchema.parse(eventId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("ID de evento inválido");
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("weekly_events")
    .delete()
    .eq("id", eventId)
    .eq("group_id", group.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/events`);
}

export async function generateOccurrences(
  slug: string,
  weeklyEventId: string,
  weeksAhead = 4
) {
  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  // Validate weeklyEventId
  try {
    uuidSchema.parse(weeklyEventId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("ID de evento semanal inválido");
    }
    throw error;
  }

  // Validate weeksAhead
  if (typeof weeksAhead !== 'number' || weeksAhead < 1 || weeksAhead > 52) {
    throw new Error("La cantidad de semanas debe estar entre 1 y 52");
  }

  const supabase = await createSupabaseServerClient();

  // Get the weekly event details
  const { data: weeklyEvent, error: eventError } = await supabase
    .from("weekly_events")
    .select("*")
    .eq("id", weeklyEventId)
    .eq("group_id", group.id)
    .single();

  if (eventError || !weeklyEvent) {
    throw new Error("Weekly event not found");
  }

  // Generate occurrences for the next N weeks
  const occurrences = [];
  const now = new Date();

  // Calculate the first occurrence date
  const baseDate = new Date(now);
  const currentDay = baseDate.getDay();
  const targetDay = weeklyEvent.weekday;

  // Calculate days to add to reach target weekday
  let daysToAdd = (targetDay - currentDay + 7) % 7;

  // Check if today is the target weekday and if we've already passed the event time
  if (daysToAdd === 0) {
    const [hours, minutes] = weeklyEvent.start_time.split(':');
    const eventTimeToday = new Date(now);
    eventTimeToday.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    if (eventTimeToday <= now) {
      daysToAdd = 7; // Move to next week if today's time has passed or is now
    }
  }

  // Set the first occurrence date
  baseDate.setDate(baseDate.getDate() + daysToAdd);

  // Generate N occurrences, each 7 days apart
  for (let i = 0; i < weeksAhead; i++) {
    // Create a NEW Date object for each occurrence (don't reuse)
    const occurrenceDate = new Date(baseDate);
    occurrenceDate.setDate(baseDate.getDate() + (i * 7));

    // Set the time
    const [hours, minutes] = weeklyEvent.start_time.split(':');
    occurrenceDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    // Skip if date is in the past (safety check)
    if (occurrenceDate < now) {
      continue;
    }

    occurrences.push({
      weekly_event_id: weeklyEventId,
      group_id: group.id,
      starts_at: occurrenceDate.toISOString(),
      status: 'open' as const,
    });
  }

  if (occurrences.length === 0) {
    return { created: 0 };
  }

  // Insert occurrences (ignore duplicates)
  const { error } = await supabase
    .from("event_occurrences")
    .upsert(occurrences, {
      onConflict: "weekly_event_id,starts_at",
      ignoreDuplicates: true,
    });

  if (error) {
    // Common root causes:
    // - RLS (no INSERT/UPDATE policy)
    // - Missing table/migration
    // - onConflict columns not backed by a UNIQUE index
    console.error("generateOccurrences: upsert failed", {
      weeklyEventId,
      groupId: group.id,
      weeksAhead,
      occurrences: occurrences.length,
      code: (error as unknown as { code?: string }).code,
      message: error.message,
      details: (error as unknown as { details?: string }).details,
      hint: (error as unknown as { hint?: string }).hint,
    });

    const code = (error as unknown as { code?: string }).code;
    if (code === "42501") {
      throw new Error(
        "No tienes permiso para generar fechas; comprueba que la base de datos esté actualizada."
      );
    }
    throw new Error(`No se pudieron generar fechas: ${error.message}`);
  }

  revalidatePath(`/g/${slug}/events`);
  return { created: occurrences.length };
}

export async function createMatchFromOccurrence(
  slug: string,
  occurrenceId: string,
  teamAPlayerIds: string[],
  teamBPlayerIds: string[],
  createdBy: string
) {
  if (!hasSupabaseEnv() && slug === "demo") {
    // Demo mode: pretend we created it.
    return { matchId: "demo-match-1" };
  }
  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  // Validate inputs
  try {
    createMatchFromOccurrenceSchema.parse({
      occurrenceId,
      teamAPlayerIds,
      teamBPlayerIds,
      createdBy,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0]?.message || "Error de validación");
    }
    throw error;
  }

  const supabase = await createSupabaseServerClient();

  // Create the match
  const now = new Date();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      group_id: group.id,
      played_at: now.toISOString(),
      best_of: 3,
      created_by: createdBy,
      updated_by: createdBy,
    })
    .select("id")
    .single();

  if (matchError || !match) {
    throw new Error("No se pudo crear el partido");
  }

  // Create teams
  const { data: teams, error: teamsError } = await supabase
    .from("match_teams")
    .insert([
      { match_id: match.id, team_number: 1, updated_by: createdBy },
      { match_id: match.id, team_number: 2, updated_by: createdBy },
    ])
    .select("id, team_number");

  if (teamsError || !teams) {
    throw new Error("No se pudieron crear los equipos");
  }

  const team1Id = teams.find((team) => team.team_number === 1)?.id;
  const team2Id = teams.find((team) => team.team_number === 2)?.id;

  if (!team1Id || !team2Id) {
    throw new Error("Faltan equipos del partido");
  }

  // Assign players to teams
  const { error: mtpError } = await supabase
    .from("match_team_players")
    .insert([
      { match_team_id: team1Id, player_id: teamAPlayerIds[0], updated_by: createdBy },
      { match_team_id: team1Id, player_id: teamAPlayerIds[1], updated_by: createdBy },
      { match_team_id: team2Id, player_id: teamBPlayerIds[0], updated_by: createdBy },
      { match_team_id: team2Id, player_id: teamBPlayerIds[1], updated_by: createdBy },
    ]);

  if (mtpError) {
    throw new Error("No se pudieron asignar jugadores a los equipos");
  }

  // Link the match to the occurrence
  const { error: updateError } = await supabase
    .from("event_occurrences")
    .update({
      loaded_match_id: match.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", occurrenceId);

  if (updateError) {
    throw new Error("No se pudo vincular el partido al evento");
  }

  // Refresh stats views
  const { error: refreshError } = await supabase.rpc("refresh_stats_views");
  if (refreshError) {
    console.error("refresh_stats_views failed", { refreshError });
  }

  // Check achievements for all players in the match
  const allPlayerIds = [...teamAPlayerIds, ...teamBPlayerIds];
  for (const playerId of allPlayerIds) {
    try {
      await supabase.rpc('check_achievements', {
        p_group_id: group.id,
        p_player_id: playerId,
      });
      await supabase.rpc('check_special_achievements', {
        p_group_id: group.id,
        p_player_id: playerId,
      });
    } catch (error) {
      console.error('Failed to check achievements for player:', playerId, error);
    }
  }

  // Auto-close events when match is created with same 4 confirmed players
  // This will mark the occurrence (and any other matching occurrences) as completed
  try {
    const closedCount = await autoCloseEventsForMatch(group.id, now, allPlayerIds);
    if (closedCount > 0) {
      console.log(`Auto-closed ${closedCount} event(s) for match ${match.id}`);
    }
  } catch (error) {
    console.error('Failed to auto-close events for match:', error);
    // Don't fail the match creation if auto-close fails
  }

  revalidatePath(`/g/${slug}/events`);
  revalidatePath(`/g/${slug}/matches`);
  revalidatePath(`/g/${slug}/ranking`);
  
  return { matchId: match.id };
}

// Team balancing functions
export type PlayerWithElo = {
  id: string;
  name: string;
  elo: number;
};

export type SuggestedTeams = {
  teamA: PlayerWithElo[];
  teamB: PlayerWithElo[];
  team1AvgElo: number;
  team2AvgElo: number;
  balanceScore: number;
};

export async function getConfirmedPlayersWithElo(
  occurrenceId: string
): Promise<PlayerWithElo[]> {
  if (!hasSupabaseEnv() && occurrenceId === "occ1") {
    return [
      { id: "p1", name: "Fede", elo: 1095 },
      { id: "p2", name: "Nico", elo: 1120 },
      { id: "p3", name: "Santi", elo: 1010 },
      { id: "p4", name: "Lucho", elo: 1040 },
    ];
  }

  const supabase = await createSupabaseServerClient();

  const { data: attendance, error: attendanceError } = await supabase
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
    const player = Array.isArray(a.players) ? a.players[0] : a.players;
    if (player) {
      players.push({ id: a.player_id, name: player.name });
    }
  });

  const { data: ratings, error: ratingsError } = await supabase
    .from("elo_ratings")
    .select("player_id, rating")
    .in("player_id", playerIds)
    .order("created_at", { ascending: false });

  if (ratingsError || !ratings) {
    return players.map((p) => ({ ...p, elo: 1000 }));
  }

  const latestEloByPlayer = new Map<string, number>();
  ratings.forEach((r) => {
    if (!latestEloByPlayer.has(r.player_id)) {
      latestEloByPlayer.set(r.player_id, r.rating);
    }
  });

  return players.map((p) => ({
    ...p,
    elo: latestEloByPlayer.get(p.id) ?? 1000,
  }));
}

export async function balanceTeams(players: PlayerWithElo[]): Promise<SuggestedTeams> {
  if (players.length < 4) {
    throw new Error("Need at least 4 players to balance teams");
  }

  const sorted = [...players].sort((a, b) => b.elo - a.elo);
  
  const team1 = [sorted[0], sorted[3]];
  const team2 = [sorted[1], sorted[2]];
  
  const team1AvgElo = (team1[0].elo + team1[1].elo) / 2;
  const team2AvgElo = (team2[0].elo + team2[1].elo) / 2;
  
  const balanceScore = 100 - Math.abs(team1AvgElo - team2AvgElo) / 10;

  return {
    teamA: team1,
    teamB: team2,
    team1AvgElo,
    team2AvgElo,
    balanceScore: Math.max(0, Math.min(100, balanceScore)),
  };
}

/**
 * Mark a past occurrence as completed
 */
export async function markOccurrenceCompleted(
  slug: string,
  occurrenceId: string
): Promise<{ ok: boolean }> {
  if (!hasSupabaseEnv() && slug === "demo") {
    return { ok: true };
  }

  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("event_occurrences")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", occurrenceId)
    .eq("group_id", group.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/events`);
  revalidatePath(`/g/${slug}`);
  return { ok: true };
}

/**
 * Link an existing match to an occurrence
 */
export async function linkMatchToOccurrence(
  slug: string,
  occurrenceId: string,
  matchId: string
): Promise<{ ok: boolean }> {
  if (!hasSupabaseEnv() && slug === "demo") {
    return { ok: true };
  }

  const group = await getGroupBySlug(slug);
  if (!group) throw new Error("Group not found");

  const member = await isGroupMember(group.id);
  if (!member) throw new Error("Not a group member");

  const supabase = await createSupabaseServerClient();

  // Verify the match exists and belongs to this group
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", matchId)
    .eq("group_id", group.id)
    .maybeSingle();

  if (matchError || !match) {
    throw new Error("Match not found");
  }

  // Link the match to the occurrence and mark as completed
  const { error } = await supabase
    .from("event_occurrences")
    .update({
      loaded_match_id: matchId,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", occurrenceId)
    .eq("group_id", group.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/events`);
  revalidatePath(`/g/${slug}`);
  return { ok: true };
}

/**
 * Get matches that could be linked to an occurrence (same day)
 */
export async function getLinkableMatches(
  slug: string,
  occurrenceId: string
): Promise<Array<{ id: string; team1: string; team2: string; score: string }>> {
  if (!hasSupabaseEnv() && slug === "demo") {
    return [];
  }

  const group = await getGroupBySlug(slug);
  if (!group) return [];

  const supabase = await createSupabaseServerClient();

  // Get the occurrence date
  const { data: occurrence, error: occError } = await supabase
    .from("event_occurrences")
    .select("starts_at")
    .eq("id", occurrenceId)
    .eq("group_id", group.id)
    .maybeSingle();

  if (occError || !occurrence) {
    return [];
  }

  // Get the date range (same day)
  const occDate = new Date(occurrence.starts_at);
  const dateStr = occDate.toISOString().slice(0, 10);
  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  // Get matches on the same day
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(`
      id,
      played_at,
      match_teams (
        team_number,
        match_team_players (
          players ( name )
        )
      ),
      sets (
        set_number,
        set_scores ( team1_games, team2_games )
      )
    `)
    .eq("group_id", group.id)
    .gte("played_at", dayStart)
    .lte("played_at", dayEnd)
    .order("played_at", { ascending: false });

  if (matchesError || !matches) {
    return [];
  }

  // Format matches for display
  return matches.map((match) => {
    const teams = Array.isArray(match.match_teams)
      ? [...match.match_teams].sort((a, b) => a.team_number - b.team_number)
      : [];

    const team1Players = teams[0]?.match_team_players
      ?.map((mtp) => {
        const player = Array.isArray(mtp.players) ? mtp.players[0] : mtp.players;
        return player?.name || "";
      })
      .filter(Boolean)
      .join(" / ") || "Equipo 1";

    const team2Players = teams[1]?.match_team_players
      ?.map((mtp) => {
        const player = Array.isArray(mtp.players) ? mtp.players[0] : mtp.players;
        return player?.name || "";
      })
      .filter(Boolean)
      .join(" / ") || "Equipo 2";

    // Build score
    const sets = Array.isArray(match.sets)
      ? [...match.sets].sort((a, b) => a.set_number - b.set_number)
      : [];

    const setScores: string[] = [];
    for (const set of sets) {
      const scores = Array.isArray(set.set_scores) ? set.set_scores[0] : set.set_scores;
      if (scores) {
        setScores.push(`${scores.team1_games}-${scores.team2_games}`);
      }
    }

    return {
      id: match.id,
      team1: team1Players,
      team2: team2Players,
      score: setScores.join(", ") || "Sin resultado",
    };
  });
}
