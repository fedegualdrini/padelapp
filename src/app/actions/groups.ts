"use server";

import { revalidatePath } from "next/cache";
import {
  requestToJoinGroup,
  type PublicGroupRow,
} from "@/lib/data";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  uuidSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

// ============================================================================
// Validation Schemas
// ============================================================================

export const joinRequestMessageSchema = z
  .string()
  .max(500, "El mensaje no puede exceder 500 caracteres")
  .transform((value) => value.trim())
  .optional();

export const requestToJoinGroupSchema = z.object({
  groupId: uuidSchema,
  playerId: uuidSchema,
  message: joinRequestMessageSchema,
});

export const updateJoinRequestSchema = z.object({
  requestId: uuidSchema,
  status: z.enum(["pending", "approved", "declined"], {
    message: "Estado de solicitud inválido",
  }),
});

export const updateGroupVisibilitySchema = z.object({
  groupId: uuidSchema,
  isPublic: z.boolean(),
  isJoinable: z.boolean(),
});

export const updateGroupProfileSchema = z.object({
  groupId: uuidSchema,
  description: z.string().max(1000, "La descripción no puede exceder 1000 caracteres").optional(),
  coverImageUrl: z.string().url("URL inválida").optional(),
  city: z.string().max(100, "La ciudad no puede exceder 100 caracteres").optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Server Action: Request to join a public group
 */
export async function requestToJoinGroupAction(
  formData: {
    groupId: string;
    playerId: string;
    message?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = requestToJoinGroupSchema.safeParse(formData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("group-join");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const result = await requestToJoinGroup(
      validationResult.data.groupId,
      validationResult.data.playerId,
      validationResult.data.message
    );

    if (!result.success) {
      return { success: false, error: "Error al solicitar unirse al grupo" };
    }

    // Revalidate the groups directory
    revalidatePath("/groups", "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in requestToJoinGroupAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al enviar solicitud",
    };
  }
}

/**
 * Server Action: Approve or decline a join request
 */
export async function updateJoinRequestAction(
  requestId: string,
  status: "approved" | "declined"
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = updateJoinRequestSchema.safeParse({ requestId, status });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("group-join");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Get the join request details
    const { data: joinRequest, error: fetchError } = await supabase
      .from("group_join_requests")
      .select("group_id, player_id")
      .eq("id", requestId)
      .single();

    if (fetchError || !joinRequest) {
      return { success: false, error: "Solicitud no encontrada" };
    }

    // Update the join request status
    const { error: updateError } = await supabase
      .from("group_join_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // If approved, add the player to the group
    if (status === "approved") {
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: joinRequest.group_id,
          user_id: joinRequest.player_id,
        });

      if (memberError) {
        console.error("Error adding member to group:", memberError);
        return { success: false, error: "Error al agregar miembro al grupo" };
      }
    }

    // Revalidate the groups directory and group page
    revalidatePath("/groups", "page");
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in updateJoinRequestAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar solicitud",
    };
  }
}

/**
 * Server Action: Update group visibility settings
 */
export async function updateGroupVisibilityAction(
  formData: {
    groupId: string;
    isPublic: boolean;
    isJoinable: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = updateGroupVisibilitySchema.safeParse(formData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("group-settings");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("groups")
      .update({
        is_public: validationResult.data.isPublic,
        is_joinable: validationResult.data.isJoinable,
      })
      .eq("id", validationResult.data.groupId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the groups directory and group page
    revalidatePath("/groups", "page");
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in updateGroupVisibilityAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar visibilidad del grupo",
    };
  }
}

/**
 * Server Action: Update group profile information
 */
export async function updateGroupProfileAction(
  formData: {
    groupId: string;
    description?: string;
    coverImageUrl?: string;
    city?: string;
    tags?: string[];
  }
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = updateGroupProfileSchema.safeParse(formData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("group-settings");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const updateData: Record<string, unknown> = {};
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }
    if (validationResult.data.coverImageUrl !== undefined) {
      updateData.cover_image_url = validationResult.data.coverImageUrl;
    }
    if (validationResult.data.city !== undefined) {
      updateData.city = validationResult.data.city;
    }
    if (validationResult.data.tags !== undefined) {
      updateData.tags = validationResult.data.tags;
    }

    const { error } = await supabase
      .from("groups")
      .update(updateData)
      .eq("id", validationResult.data.groupId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the groups directory and group page
    revalidatePath("/groups", "page");
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in updateGroupProfileAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar perfil del grupo",
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
export type { PublicGroupRow };
