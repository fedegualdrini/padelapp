"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug, isGroupMember } from "@/lib/data";

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

  // Check if user is admin
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  // For now, allow any member to create events (can be restricted later)
  const { error } = await supabase
    .from("weekly_events")
    .insert({
      group_id: group.id,
      name: data.name,
      weekday: data.weekday,
      start_time: data.startTime,
      capacity: data.capacity,
      cutoff_weekday: data.cutoffWeekday,
      cutoff_time: data.cutoffTime,
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

  const supabase = await createSupabaseServerClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.weekday !== undefined) updateData.weekday = data.weekday;
  if (data.startTime !== undefined) updateData.start_time = data.startTime;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.cutoffWeekday !== undefined) updateData.cutoff_weekday = data.cutoffWeekday;
  if (data.cutoffTime !== undefined) updateData.cutoff_time = data.cutoffTime;
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
  
  for (let i = 0; i < weeksAhead; i++) {
    const occurrenceDate = new Date(now);
    occurrenceDate.setDate(now.getDate() + (i * 7));
    
    // Adjust to the correct weekday
    const currentDay = occurrenceDate.getDay();
    const targetDay = weeklyEvent.weekday;
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    occurrenceDate.setDate(occurrenceDate.getDate() + daysToAdd);
    
    // Set the time
    const [hours, minutes] = weeklyEvent.start_time.split(':');
    occurrenceDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    // Skip if the date is in the past
    if (occurrenceDate < now) continue;

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
      onConflict: 'weekly_event_id,starts_at',
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/g/${slug}/events`);
  return { created: occurrences.length };
}
