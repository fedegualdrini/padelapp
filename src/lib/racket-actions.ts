"use server";

import { revalidatePath } from "next/cache";
import {
  createRacket,
  updateRacket,
  deleteRacket,
  setMatchRacket,
  setMatchRackets,
} from "@/lib/racket-data";
import type { RacketInput, RacketUpdateInput } from "@/lib/racket-types";

// ============================================================================
// Racket Server Actions
// ============================================================================

/**
 * Create a new racket
 */
export async function actionCreateRacket(playerId: string, racket: RacketInput) {
  try {
    const result = await createRacket(playerId, racket);

    if (!result) {
      return { success: false, error: "Failed to create racket" };
    }

    // Revalidate player profile pages
    revalidatePath(`/g/[slug]/players/[id]`);
    revalidatePath(`/g/[slug]/players/[id]/rackets`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating racket:", error);
    return { success: false, error: "An error occurred while creating the racket" };
  }
}

/**
 * Update an existing racket
 */
export async function actionUpdateRacket(racket: RacketUpdateInput) {
  try {
    const result = await updateRacket(racket);

    if (!result) {
      return { success: false, error: "Failed to update racket" };
    }

    // Revalidate player profile pages
    revalidatePath(`/g/[slug]/players/[id]`);
    revalidatePath(`/g/[slug]/players/[id]/rackets`);
    revalidatePath(`/g/[slug]/players/[id]/rackets/[racketId]`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating racket:", error);
    return { success: false, error: "An error occurred while updating the racket" };
  }
}

/**
 * Delete a racket
 */
export async function actionDeleteRacket(racketId: string) {
  try {
    const result = await deleteRacket(racketId);

    if (!result) {
      return { success: false, error: "Failed to delete racket" };
    }

    // Revalidate player profile pages
    revalidatePath(`/g/[slug]/players/[id]`);
    revalidatePath(`/g/[slug]/players/[id]/rackets`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting racket:", error);
    return { success: false, error: "An error occurred while deleting the racket" };
  }
}

/**
 * Set racket for a player in a match
 */
export async function actionSetMatchRacket(
  matchId: string,
  playerId: string,
  racketId: string | null
) {
  try {
    const result = await setMatchRacket(matchId, playerId, racketId);

    if (!result) {
      return { success: false, error: "Failed to set racket" };
    }

    // Revalidate match pages
    revalidatePath(`/g/[slug]/matches/[id]`);
    revalidatePath(`/g/[slug]/matches/[id]/edit`);
    revalidatePath(`/g/[slug]/players/[id]/rackets`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error setting match racket:", error);
    return { success: false, error: "An error occurred while setting the racket" };
  }
}

/**
 * Batch set rackets for all players in a match
 */
export async function actionSetMatchRackets(
  matchId: string,
  playerRackets: { playerId: string; racketId: string | null }[]
) {
  try {
    const result = await setMatchRackets(matchId, playerRackets);

    if (!result) {
      return { success: false, error: "Failed to set rackets" };
    }

    // Revalidate match pages
    revalidatePath(`/g/[slug]/matches/[id]`);
    revalidatePath(`/g/[slug]/matches/[id]/edit`);
    revalidatePath(`/g/[slug]/players/[id]/rackets`);

    return { success: true };
  } catch (error) {
    console.error("Error setting match rackets:", error);
    return { success: false, error: "An error occurred while setting the rackets" };
  }
}
