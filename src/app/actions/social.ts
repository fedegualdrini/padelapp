"use server";

import { revalidatePath } from "next/cache";
import {
  createPost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  type SocialPostRow,
} from "@/lib/data";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  uuidSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

// ============================================================================
// Validation Schemas
// ============================================================================

export const postContentSchema = z
  .string()
  .min(1, "El contenido no puede estar vacío")
  .max(5000, "El contenido no puede exceder 5000 caracteres")
  .transform((value) => value.trim());

export const postTypeSchema = z.enum(["match_result", "announcement", "discussion", "booking"], {
  message: "Tipo de post inválido",
});

export const createPostSchema = z.object({
  groupId: uuidSchema,
  playerId: uuidSchema,
  postType: postTypeSchema,
  content: postContentSchema,
  relatedMatchId: uuidSchema.optional(),
  relatedBookingId: uuidSchema.optional(),
});

export const likePostSchema = z.object({
  postId: uuidSchema,
  playerId: uuidSchema,
});

export const commentContentSchema = z
  .string()
  .min(1, "El comentario no puede estar vacío")
  .max(2000, "El comentario no puede exceder 2000 caracteres")
  .transform((value) => value.trim());

export const addCommentSchema = z.object({
  postId: uuidSchema,
  playerId: uuidSchema,
  content: commentContentSchema,
  parentCommentId: uuidSchema.optional(),
});

export const deleteCommentSchema = z.object({
  commentId: uuidSchema,
  playerId: uuidSchema,
});

export const deletePostSchema = z.object({
  postId: uuidSchema,
  groupId: uuidSchema,
});

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Server Action: Create a new social post
 */
export async function createPostAction(
  formData: {
    groupId: string;
    playerId: string;
    postType: "match_result" | "announcement" | "discussion" | "booking";
    content: string;
    relatedMatchId?: string;
    relatedBookingId?: string;
  }
): Promise<{ success: boolean; post: SocialPostRow | null; error: string | null }> {
  // Validate inputs
  const validationResult = createPostSchema.safeParse(formData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, post: null, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("social");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, post: null, error: error.message };
    }
    throw error;
  }

  try {
    const postData = validationResult.data;
    const post = await createPost({
      groupId: postData.groupId,
      playerId: postData.playerId,
      postType: postData.postType,
      content: postData.content,
      relatedMatchId: postData.relatedMatchId,
      relatedBookingId: postData.relatedBookingId,
    });

    if (!post) {
      return { success: false, post: null, error: "Error al crear post" };
    }

    // Revalidate the social feed
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, post, error: null };
  } catch (error) {
    console.error("Error in createPostAction:", error);
    return {
      success: false,
      post: null,
      error: error instanceof Error ? error.message : "Error al crear post",
    };
  }
}

/**
 * Server Action: Like or unlike a post
 */
export async function toggleLikePostAction(
  postId: string,
  playerId: string
): Promise<{ success: boolean; liked: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = likePostSchema.safeParse({ postId, playerId });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, liked: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("social");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, liked: false, error: error.message };
    }
    throw error;
  }

  try {
    // Check if post is already liked
    const supabase = await createSupabaseServerClient();
    const { data: existingLike, error: checkError } = await supabase
      .from("social_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("player_id", playerId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, liked: false, error: checkError.message };
    }

    if (existingLike) {
      // Unlike the post
      const result = await unlikePost(postId, playerId);
      if (result.error) {
        return { success: false, liked: false, error: result.error };
      }
      revalidatePath(`/g/[slug]`, "page");
      return { success: true, liked: false, error: null };
    } else {
      // Like the post
      const result = await likePost(postId, playerId);
      if (!result.success) {
        return { success: false, liked: false, error: "Error al dar me gusta" };
      }
      revalidatePath(`/g/[slug]`, "page");
      return { success: true, liked: result.liked, error: null };
    }
  } catch (error) {
    console.error("Error in toggleLikePostAction:", error);
    return {
      success: false,
      liked: false,
      error: error instanceof Error ? error.message : "Error al alternar me gusta",
    };
  }
}

/**
 * Server Action: Add a comment to a post
 */
export async function addCommentAction(
  formData: {
    postId: string;
    playerId: string;
    content: string;
    parentCommentId?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = addCommentSchema.safeParse(formData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("social");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const commentData = validationResult.data;
    const { error } = await addComment({
      postId: commentData.postId,
      playerId: commentData.playerId,
      content: commentData.content,
      parentCommentId: commentData.parentCommentId,
    });

    if (error) {
      return { success: false, error };
    }

    // Revalidate the social feed
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in addCommentAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al agregar comentario",
    };
  }
}

/**
 * Server Action: Delete a comment
 */
export async function deleteCommentAction(
  commentId: string,
  playerId: string
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = deleteCommentSchema.safeParse({ commentId, playerId });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("social");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const { error } = await deleteComment(commentId);

    if (error) {
      return { success: false, error };
    }

    // Revalidate the social feed
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in deleteCommentAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar comentario",
    };
  }
}

/**
 * Server Action: Delete a post
 */
export async function deletePostAction(
  postId: string,
  groupId: string
): Promise<{ success: boolean; error: string | null }> {
  // Validate inputs
  const validationResult = deletePostSchema.safeParse({ postId, groupId });

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  // Rate limit check
  try {
    await assertRateLimit("social");
  } catch (error) {
    if (error instanceof Error && "rateLimitExceeded" in error) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", postId)
      .eq("group_id", groupId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the social feed
    revalidatePath(`/g/[slug]`, "page");

    return { success: true, error: null };
  } catch (error) {
    console.error("Error in deletePostAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar post",
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
export type { SocialPostRow };
