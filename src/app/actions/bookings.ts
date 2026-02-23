"use server";

import { revalidatePath } from "next/cache";
import {
  createBooking,
  cancelBooking as cancelBookingData,
  type BookingRow,
} from "@/lib/data";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  uuidSchema,
  dateStringSchema,
  timeStringSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

// ============================================================================
// Validation Schemas
// ============================================================================

export const bookingCourtIdSchema = uuidSchema;

export const bookingVenueIdSchema = uuidSchema;

export const bookingDateSchema = dateStringSchema;

export const bookingStartTimeSchema = timeStringSchema;

export const bookingDurationSchema = z
  .number()
  .int("La duración debe ser un número entero")
  .positive("La duración debe ser positiva")
  .max(480, "La duración no puede exceder 8 horas (480 minutos)");

export const bookingTotalCentsSchema = z
  .number()
  .int("El precio debe ser un número entero")
  .nonnegative("El precio no puede ser negativo");

export const createBookingSchema = z.object({
  venueId: bookingVenueIdSchema,
  courtId: bookingCourtIdSchema,
  groupId: uuidSchema,
  date: bookingDateSchema,
  startTime: bookingStartTimeSchema,
  durationMinutes: bookingDurationSchema,
  totalCents: bookingTotalCentsSchema,
  isPublic: z.boolean().optional(),
  openToCommunity: z.boolean().optional(),
  maxPlayers: z.number().int().positive().max(8).optional(),
});

export const cancelBookingSchema = z.object({
  bookingId: uuidSchema,
  groupId: uuidSchema,
});

export const updateBookingStatusSchema = z.object({
  bookingId: uuidSchema,
  status: z.enum(["pending", "confirmed", "cancelled", "completed"], {
    message: "Estado de reserva inválido",
  }),
});

export const addBookingParticipantSchema = z.object({
  bookingId: uuidSchema,
  playerId: uuidSchema,
  status: z.enum(["confirmed", "pending", "declined"], {
    message: "Estado de participante inválido",
  }).optional(),
});

export const removeBookingParticipantSchema = z.object({
  bookingId: uuidSchema,
  playerId: uuidSchema,
});

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Server Action: Create a new court booking
 */
export async function createBookingAction(
  formData: {
    venueId: string;
    courtId: string;
    groupId: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    totalCents: number;
    isPublic?: boolean;
    openToCommunity?: boolean;
    maxPlayers?: number;
  }
): Promise<{ success: boolean; booking: BookingRow | null; error: string | null }> {
  // Validate inputs
  const validationResult = createBookingSchema.safeParse(formData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, booking: null, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("booking");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, booking: null, error: error.message };
    }
    throw error;
  }

  try {
    // Parse date and time to create start and end timestamps
    const { date, startTime, durationMinutes, totalCents, venueId, courtId, groupId, isPublic, openToCommunity, maxPlayers } = validationResult.data;

    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    const { booking, error } = await createBooking({
      venueId,
      courtId,
      groupId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      durationMinutes,
      totalCents,
      isPublic: isPublic || false,
      openToCommunity: openToCommunity || false,
      maxPlayers,
    });

    if (error || !booking) {
      return { success: false, booking: null, error: error || "Error al crear reserva" };
    }

    // Revalidate the bookings page
    revalidatePath(`/g/[slug]/bookings`, "page");
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, booking, error: null };
  } catch (error) {
    console.error("Error in createBookingAction:", error);
    return {
      success: false,
      booking: null,
      error: error instanceof Error ? error.message : "Error al crear reserva",
    };
  }
}

/**
 * Server Action: Cancel a booking
 */
export async function cancelBookingAction(
  bookingId: string,
  groupId: string
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = cancelBookingSchema.safeParse({ bookingId, groupId });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("booking");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const { error } = await cancelBookingData(bookingId);

    if (error) {
      return { success: false, error };
    }

    // Revalidate the bookings page
    revalidatePath(`/g/[slug]/bookings`, "page");
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in cancelBookingAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cancelar reserva",
    };
  }
}

/**
 * Server Action: Update booking status
 */
export async function updateBookingStatusAction(
  bookingId: string,
  status: "pending" | "confirmed" | "cancelled" | "completed"
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = updateBookingStatusSchema.safeParse({ bookingId, status });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("booking");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the bookings page
    revalidatePath(`/g/[slug]/bookings`, "page");
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in updateBookingStatusAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar estado de reserva",
    };
  }
}

/**
 * Server Action: Add participant to booking
 */
export async function addBookingParticipantAction(
  bookingId: string,
  playerId: string,
  status: "confirmed" | "pending" | "declined" = "confirmed"
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = addBookingParticipantSchema.safeParse({
    bookingId,
    playerId,
    status,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("booking");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("booking_participants")
      .insert({
        booking_id: bookingId,
        player_id: playerId,
        status,
      });

    if (error) {
      // Check if it's a duplicate (player already in booking)
      if (error.code === "23505") {
        return { success: false, error: "El jugador ya está en esta reserva" };
      }
      return { success: false, error: error.message };
    }

    // Revalidate the bookings page
    revalidatePath(`/g/[slug]/bookings`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in addBookingParticipantAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al agregar participante",
    };
  }
}

/**
 * Server Action: Remove participant from booking
 */
export async function removeBookingParticipantAction(
  bookingId: string,
  playerId: string
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = removeBookingParticipantSchema.safeParse({
    bookingId,
    playerId,
  });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("booking");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("booking_participants")
      .delete()
      .eq("booking_id", bookingId)
      .eq("player_id", playerId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the bookings page
    revalidatePath(`/g/[slug]/bookings`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in removeBookingParticipantAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al remover participante",
    };
  }
}

/**
 * Helper function to create Supabase client
 */
async function createSupabaseServerClient() {
  // Import dynamically to avoid circular dependencies
  const { createSupabaseServerClient: createClient } = await import("@/lib/supabase/server");
  return createClient();
}

// Export types for use in components
export type { BookingRow };
