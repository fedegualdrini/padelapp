'use server';

// ============================================================================
// Venue Server Actions
// ============================================================================
// Server actions for venue management, ratings, reviews, and analytics
// ============================================================================

import { revalidatePath } from 'next/cache';
import {
  createVenue as createVenueData,
  updateVenue as updateVenueData,
  deleteVenue as deleteVenueData,
  getVenueById,
  getVenueBySlug,
  listVenues,
  getVenueRatings,
  getMyVenueRating,
  createVenueRating as createVenueRatingData,
  updateVenueRating as updateVenueRatingData,
  deleteVenueRating as deleteVenueRatingData,
  createVenueComment,
  deleteVenueComment,
  voteOnReview,
  removeVoteOnReview,
  getVenueAnalytics,
  getVenueDashboard,
  getVenueRecommendations,
} from './venue-data';
import type {
  Venue,
  VenueCreateInput,
  VenueUpdateInput,
  VenueListItem,
  VenueReview,
  VenueRating,
  VenueRatingCreateInput,
  VenueRatingUpdateInput,
  VenueAnalytics,
  VenueDashboard,
  VenueRecommendationsResponse,
  VenueSortBy,
  VenueFilter,
  RatingSortBy,
} from './venue-types';

// ============================================================================
// Venue Management Actions
// ============================================================================

/**
 * Create a new venue
 */
export async function createVenue(
  input: VenueCreateInput
): Promise<{ success: boolean; venue?: Venue; error?: string }> {
  try {
    const venue = await createVenueData(input);
    revalidatePath(`/g/[slug]/venues`);
    revalidatePath(`/g/[slug]/admin`);
    return { success: true, venue };
  } catch (error) {
    console.error('Error creating venue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create venue',
    };
  }
}

/**
 * Update an existing venue
 */
export async function updateVenue(
  id: string,
  updates: VenueUpdateInput
): Promise<{ success: boolean; venue?: Venue; error?: string }> {
  try {
    const venue = await updateVenueData(id, updates);
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    revalidatePath(`/g/[slug]/venues`);
    revalidatePath(`/g/[slug]/admin`);
    return { success: true, venue };
  } catch (error) {
    console.error('Error updating venue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update venue',
    };
  }
}

/**
 * Delete a venue
 */
export async function deleteVenue(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteVenueData(id);
    revalidatePath(`/g/[slug]/venues`);
    revalidatePath(`/g/[slug]/admin`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting venue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete venue',
    };
  }
}

/**
 * Get venue by ID
 */
export async function fetchVenueById(
  id: string
): Promise<{ success: boolean; venue?: Venue; error?: string }> {
  try {
    const venue = await getVenueById(id);
    return { success: true, venue: venue || undefined };
  } catch (error) {
    console.error('Error fetching venue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch venue',
    };
  }
}

/**
 * Get venue by slug
 */
export async function fetchVenueBySlug(
  slug: string,
  groupId: string
): Promise<{ success: boolean; venue?: Venue; error?: string }> {
  try {
    const venue = await getVenueBySlug(slug, groupId);
    return { success: true, venue: venue || undefined };
  } catch (error) {
    console.error('Error fetching venue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch venue',
    };
  }
}

/**
 * List venues
 */
export async function fetchVenues(
  groupId: string,
  options: {
    sortBy?: VenueSortBy;
    filters?: VenueFilter;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  success: boolean;
  data?: { venues: VenueListItem[]; total: number; page: number; limit: number };
  error?: string;
}> {
  try {
    const data = await listVenues(groupId, options);
    return { success: true, data };
  } catch (error) {
    console.error('Error listing venues:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list venues',
    };
  }
}

// ============================================================================
// Venue Rating Actions
// ============================================================================

/**
 * Submit a venue rating
 */
export async function submitVenueRating(
  input: VenueRatingCreateInput
): Promise<{ success: boolean; rating?: VenueRating; error?: string }> {
  try {
    const rating = await createVenueRatingData(input);
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    revalidatePath(`/g/[slug]/venues`);
    revalidatePath(`/g/[slug]/admin/venue-analytics`);
    return { success: true, rating };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit rating',
    };
  }
}

/**
 * Update an existing rating
 */
export async function editVenueRating(
  ratingId: string,
  updates: VenueRatingUpdateInput
): Promise<{ success: boolean; rating?: VenueRating; error?: string }> {
  try {
    const rating = await updateVenueRatingData(ratingId, updates);
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    revalidatePath(`/g/[slug]/venues`);
    revalidatePath(`/g/[slug]/admin/venue-analytics`);
    return { success: true, rating };
  } catch (error) {
    console.error('Error updating rating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rating',
    };
  }
}

/**
 * Delete a rating
 */
export async function removeVenueRating(
  ratingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteVenueRatingData(ratingId);
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    revalidatePath(`/g/[slug]/venues`);
    revalidatePath(`/g/[slug]/admin/venue-analytics`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting rating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete rating',
    };
  }
}

/**
 * Get current user's rating for a venue
 */
export async function fetchMyVenueRating(
  venueId: string,
  playerId: string
): Promise<{ success: boolean; rating?: VenueRating; error?: string }> {
  try {
    const rating = await getMyVenueRating(venueId, playerId);
    return { success: true, rating: rating || undefined };
  } catch (error) {
    console.error('Error fetching rating:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rating',
    };
  }
}

/**
 * Get all ratings for a venue
 */
export async function fetchVenueRatings(
  venueId: string,
  options: {
    sortBy?: RatingSortBy;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  success: boolean;
  data?: {
    ratings: VenueReview[];
    total: number;
    average: {
      overall: number;
      court_quality: number;
      lighting: number;
      comfort: number;
      amenities: number;
      accessibility: number;
      atmosphere: number;
    };
    your_rating: VenueRating | null;
  };
  error?: string;
}> {
  try {
    const data = await getVenueRatings(venueId, options);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ratings',
    };
  }
}

// ============================================================================
// Venue Comment Actions
// ============================================================================

/**
 * Add a comment to a review
 */
export async function submitVenueComment(
  rating_id: string,
  player_id: string,
  group_id: string,
  comment_text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await createVenueComment({ rating_id, player_id, group_id, comment_text });
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    return { success: true };
  } catch (error) {
    console.error('Error submitting comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit comment',
    };
  }
}

/**
 * Delete a comment
 */
export async function removeVenueComment(
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteVenueComment(commentId);
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete comment',
    };
  }
}

// ============================================================================
// Helpful Vote Actions
// ============================================================================

/**
 * Vote on a review as helpful or not helpful
 */
export async function voteOnReviewHelpful(
  ratingId: string,
  playerId: string,
  groupId: string,
  isHelpful: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await voteOnReview(ratingId, playerId, groupId, isHelpful);
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    return { success: true };
  } catch (error) {
    console.error('Error voting on review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to vote on review',
    };
  }
}

/**
 * Remove vote on a review
 */
export async function removeReviewVote(
  ratingId: string,
  playerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await removeVoteOnReview(ratingId, playerId);
    revalidatePath(`/g/[slug]/venues/[venue-slug]`);
    return { success: true };
  } catch (error) {
    console.error('Error removing vote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove vote',
    };
  }
}

// ============================================================================
// Venue Analytics Actions
// ============================================================================

/**
 * Get venue analytics
 */
export async function fetchVenueAnalytics(
  venueId: string
): Promise<{ success: boolean; analytics?: VenueAnalytics; error?: string }> {
  try {
    const analytics = await getVenueAnalytics(venueId);
    return { success: true, analytics: analytics || undefined };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    };
  }
}

/**
 * Get venue dashboard analytics (admin)
 */
export async function fetchVenueDashboard(
  groupId: string
): Promise<{ success: boolean; dashboard?: VenueDashboard; error?: string }> {
  try {
    const dashboard = await getVenueDashboard(groupId);
    return { success: true, dashboard };
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard',
    };
  }
}

/**
 * Get venue recommendations
 */
export async function fetchVenueRecommendations(
  groupId: string
): Promise<{ success: boolean; recommendations?: VenueRecommendationsResponse; error?: string }> {
  try {
    const recommendations = await getVenueRecommendations(groupId);
    return { success: true, recommendations };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recommendations',
    };
  }
}
