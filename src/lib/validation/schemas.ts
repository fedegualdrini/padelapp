/**
 * @fileoverview Input Validation and Sanitization Schemas
 * 
 * This module provides comprehensive Zod-based validation schemas for all API endpoints
 * and server actions in the padel application.
 * 
 * ## Validation Patterns
 * 
 * ### 1. Schema Organization
 * Schemas are organized by domain (groups, players, matches, events, venues, tournaments).
 * Each domain has:
 * - Primitive schemas (e.g., `playerNameSchema`) for reusable field validation
 * - Object schemas (e.g., `addPlayerSchema`) for full form validation
 * 
 * ### 2. Input Sanitization
 * All string inputs are sanitized using `sanitizeString` which:
 * - Trims whitespace
 * - Removes `<script>` tags
 * - Removes `javascript:` URLs
 * - Removes `on*` event handlers
 * 
 * ### 3. Error Messages
 * All validation rules include user-friendly Spanish error messages.
 * Use `message` parameter for Zod v4 enum schemas.
 * 
 * ### 4. UUID Validation
 * All IDs use `uuidSchema` to ensure valid UUID format.
 * 
 * ### 5. Rate Limiting Awareness
 * Validation errors are returned early to avoid unnecessary database calls.
 * Consider implementing rate limiting on server actions that use these schemas.
 * 
 * ## Usage Example
 * ```typescript
 * import { addPlayerSchema } from "@/lib/validation";
 * 
 * const result = addPlayerSchema.safeParse({
 *   playerName: "Juan",
 *   playerStatus: "usual",
 *   groupId: "uuid-here",
 *   groupSlug: "my-group",
 * });
 * 
 * if (!result.success) {
 *   const errorMessage = result.error.issues[0]?.message;
 *   return { error: errorMessage };
 * }
 * ```
 * 
 * @module lib/validation
 */

import { z } from "zod";

// ============================================================================
// Common Validation Helpers
// ============================================================================

/**
 * Sanitize string input by trimming and removing potentially dangerous characters
 */
export const sanitizeString = (value: string): string => {
  return value
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ""); // Remove event handlers
};

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid("ID inválido");

/**
 * Date string validation (YYYY-MM-DD)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (usar YYYY-MM-DD)");

/**
 * Time string validation (HH:MM)
 */
export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (usar HH:MM)")
  .refine((time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }, "Hora fuera de rango (00:00-23:59)");

// ============================================================================
// Group Validation Schemas
// ============================================================================

export const groupNameSchema = z
  .string()
  .min(2, "El nombre del grupo debe tener al menos 2 caracteres")
  .max(100, "El nombre del grupo no puede exceder 100 caracteres")
  .transform(sanitizeString);

export const groupPassphraseSchema = z
  .string()
  .min(4, "La clave del grupo debe tener al menos 4 caracteres")
  .max(50, "La clave del grupo no puede exceder 50 caracteres")
  .transform(sanitizeString);

export const groupSlugSchema = z
  .string()
  .min(2, "El slug debe tener al menos 2 caracteres")
  .max(100, "El slug no puede exceder 100 caracteres")
  .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones");

export const createGroupSchema = z.object({
  groupName: groupNameSchema,
  groupPassphrase: groupPassphraseSchema,
});

export const joinGroupSchema = z.object({
  groupSlug: groupSlugSchema,
  groupPassphrase: groupPassphraseSchema,
});

// ============================================================================
// Player Validation Schemas
// ============================================================================

export const playerNameSchema = z
  .string()
  .min(2, "El nombre del jugador debe tener al menos 2 caracteres")
  .max(100, "El nombre del jugador no puede exceder 100 caracteres")
  .transform(sanitizeString);

export const playerStatusSchema = z.enum(["usual", "invite"], {
  message: "Estado de jugador inválido",
});

export const addPlayerSchema = z.object({
  playerName: playerNameSchema,
  playerStatus: playerStatusSchema,
  groupId: uuidSchema,
  groupSlug: groupSlugSchema,
  createdBy: uuidSchema.optional(),
});

export const updatePlayerSchema = z.object({
  playerId: uuidSchema,
  playerName: playerNameSchema,
  groupId: uuidSchema,
  groupSlug: groupSlugSchema,
  updatedBy: uuidSchema.optional(),
  editKey: z.string().optional(),
});

// ============================================================================
// Match Validation Schemas
// ============================================================================

/**
 * Valid set score combinations for padel/tennis
 * - 6-0, 6-1, 6-2, 6-3, 6-4 (standard wins)
 * - 7-5, 7-6 (tiebreak scenarios)
 */
const validSetScores = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4],
  [0, 6], [1, 6], [2, 6], [3, 6], [4, 6],
  [7, 5], [7, 6], [5, 7], [6, 7],
];

export const setScoreSchema = z
  .object({
    team1: z.number().int("El puntaje debe ser un número entero").min(0).max(7),
    team2: z.number().int("El puntaje debe ser un número entero").min(0).max(7),
  })
  .refine(
    ({ team1, team2 }) => {
      return validSetScores.some(([t1, t2]) => team1 === t1 && team2 === t2);
    },
    {
      message: "Combinación de puntaje inválida para el set",
    }
  );

export const matchBestOfSchema = z.union([z.literal(3), z.literal(5)], {
  message: "El mejor de debe ser 3 o 5",
});

export const matchPlayerIdsSchema = z
  .array(uuidSchema)
  .length(4, "Se requieren exactamente 4 jugadores")
  .refine((ids) => new Set(ids).size === 4, {
    message: "Los jugadores deben ser únicos entre equipos",
  });

export const createMatchSchema = z.object({
  groupId: uuidSchema,
  groupSlug: groupSlugSchema,
  playedDate: dateStringSchema,
  playedTime: timeStringSchema,
  bestOf: matchBestOfSchema,
  createdBy: uuidSchema,
  team1Player1: uuidSchema,
  team1Player2: uuidSchema,
  team2Player1: uuidSchema,
  team2Player2: uuidSchema,
  mvpPlayerId: uuidSchema.optional(),
  sets: z.array(setScoreSchema).min(1, "Al menos un set es requerido"),
});

export const updateMatchSchema = createMatchSchema.extend({
  matchId: uuidSchema,
  updatedBy: uuidSchema,
});

// ============================================================================
// Event Validation Schemas
// ============================================================================

export const eventWeekdaySchema = z.number().int().min(0).max(6, "Día de la semana inválido (0-6)");

export const eventCapacitySchema = z
  .number()
  .int("La capacidad debe ser un número entero")
  .positive("La capacidad debe ser positiva")
  .max(100, "La capacidad no puede exceder 100");

export const eventNameSchema = z
  .string()
  .min(2, "El nombre del evento debe tener al menos 2 caracteres")
  .max(200, "El nombre del evento no puede exceder 200 caracteres")
  .transform(sanitizeString);

export const attendanceStatusSchema = z.enum(["confirmed", "declined", "maybe", "waitlist"], {
  message: "Estado de asistencia inválido",
});

export const createWeeklyEventSchema = z.object({
  name: eventNameSchema,
  weekday: eventWeekdaySchema,
  startTime: timeStringSchema,
  capacity: eventCapacitySchema,
  cutoffWeekday: eventWeekdaySchema,
  cutoffTime: timeStringSchema,
});

export const updateWeeklyEventSchema = createWeeklyEventSchema.partial();

export const updateAttendanceSchema = z.object({
  occurrenceId: uuidSchema,
  playerId: uuidSchema,
  status: attendanceStatusSchema,
});

export const createMatchFromOccurrenceSchema = z.object({
  occurrenceId: uuidSchema,
  teamAPlayerIds: z.array(uuidSchema).length(2, "Se requieren 2 jugadores por equipo"),
  teamBPlayerIds: z.array(uuidSchema).length(2, "Se requieren 2 jugadores por equipo"),
  createdBy: uuidSchema,
});

// ============================================================================
// Invite Validation Schemas
// ============================================================================

export const inviteTokenSchema = z
  .string()
  .uuid("Token de invitación inválido");

export const inviteIdSchema = z
  .string()
  .uuid("ID de invitación inválido");

export const expiresInDaysSchema = z
  .number()
  .int("Los días deben ser un número entero")
  .positive("Los días deben ser positivos")
  .max(365, "La invitación no puede durar más de un año")
  .nullable();

export const maxUsesSchema = z
  .number()
  .int("El máximo de usos debe ser un número entero")
  .positive("El máximo de usos debe ser positivo")
  .max(1000, "El máximo de usos no puede exceder 1000")
  .nullable();

export const createInviteSchema = z.object({
  groupId: uuidSchema,
  expiresInDays: expiresInDaysSchema,
  maxUses: maxUsesSchema,
});

export const validateInviteSchema = z.object({
  token: inviteTokenSchema,
});

export const deleteInviteSchema = z.object({
  inviteId: inviteIdSchema,
});

// ============================================================================
// Venue Validation Schemas
// ============================================================================

export const venueNameSchema = z
  .string()
  .min(2, "El nombre de la cancha debe tener al menos 2 caracteres")
  .max(200, "El nombre de la cancha no puede exceder 200 caracteres")
  .transform(sanitizeString);

export const venueAddressSchema = z
  .string()
  .min(5, "La dirección debe tener al menos 5 caracteres")
  .max(500, "La dirección no puede exceder 500 caracteres")
  .transform(sanitizeString);

export const venueCourtCountSchema = z
  .number()
  .int("La cantidad de canchas debe ser un número entero")
  .positive("La cantidad de canchas debe ser positiva")
  .max(100, "La cantidad de canchas no puede exceder 100");

export const venueSurfaceTypeSchema = z.enum(["glass", "cement", "artificial_grass", "other"], {
  message: "Tipo de superficie inválido",
});

export const venueIndoorOutdoorSchema = z.enum(["indoor", "outdoor", "both"], {
  message: "Tipo de ubicación inválido",
});

export const venueLightingSchema = z.enum(["led", "fluorescent", "natural", "none"], {
  message: "Tipo de iluminación inválido",
});

export const createVenueSchema = z.object({
  name: venueNameSchema,
  address: venueAddressSchema,
  numCourts: venueCourtCountSchema,
  surfaceType: venueSurfaceTypeSchema,
  indoorOutdoor: venueIndoorOutdoorSchema,
  lighting: venueLightingSchema,
  groupId: uuidSchema,
});

// ============================================================================
// Tournament Validation Schemas
// ============================================================================

export const tournamentNameSchema = z
  .string()
  .min(2, "El nombre del torneo debe tener al menos 2 caracteres")
  .max(200, "El nombre del torneo no puede exceder 200 caracteres")
  .transform(sanitizeString);

export const tournamentFormatSchema = z.enum(["americano", "round_robin", "bracket"], {
  message: "Formato de torneo inválido",
});

export const tournamentStatusSchema = z.enum(["upcoming", "in_progress", "completed"], {
  message: "Estado de torneo inválido",
});

export const tournamentScoringSystemSchema = z.enum(["standard_21", "custom"], {
  message: "Sistema de puntuación inválido",
});

export const tournamentCourtCountSchema = z
  .number()
  .int("La cantidad de canchas debe ser un número entero")
  .positive("La cantidad de canchas debe ser positiva")
  .max(50, "La cantidad de canchas no puede exceder 50");

export const tournamentParticipantIdsSchema = z
  .array(uuidSchema)
  .min(4, "Se requieren al menos 4 participantes")
  .max(64, "No se permiten más de 64 participantes")
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Los participantes deben ser únicos",
  });

export const createTournamentSchema = z.object({
  groupId: uuidSchema,
  name: tournamentNameSchema,
  format: tournamentFormatSchema,
  startDate: dateStringSchema,
  scoringSystem: tournamentScoringSystemSchema,
  courtCount: tournamentCourtCountSchema,
  participantIds: tournamentParticipantIdsSchema,
});

export const updateTournamentStatusSchema = z.object({
  tournamentId: uuidSchema,
  status: tournamentStatusSchema,
});

export const addTournamentParticipantSchema = z.object({
  tournamentId: uuidSchema,
  playerId: uuidSchema,
  seedPosition: z.number().int().positive().max(64).optional(),
});

export const updateTournamentMatchScoreSchema = z.object({
  tournamentMatchId: uuidSchema,
  team1Games: z.number().int().min(0).max(99),
  team2Games: z.number().int().min(0).max(99),
});

export const deleteTournamentSchema = z.object({
  tournamentId: uuidSchema,
  groupId: uuidSchema.optional(),
});

// ============================================================================
// Sanitization Utilities
// ============================================================================

/**
 * Sanitize a string by trimming and removing XSS vectors
 */
export function sanitizeInput(input: string): string {
  return sanitizeString(input);
}

/**
 * Sanitize all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate and parse form data with a Zod schema
 * Returns either the validated data or throws with a user-friendly error
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData | Record<string, unknown>
): T {
  const data: Record<string, unknown> = {};
  
  if (formData instanceof FormData) {
    formData.forEach((value, key) => {
      data[key] = value;
    });
  } else {
    Object.assign(data, formData);
  }
  
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const firstError = result.error.issues[0];
    throw new Error(firstError?.message || "Error de validación");
  }
  
  return result.data;
}

/**
 * Validate with detailed error messages
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return { success: false, errors };
}
