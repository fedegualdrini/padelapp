// ============================================================================
// Venue Data Access Layer
// ============================================================================
// Functions for querying and managing venue data in Supabase
// ============================================================================

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  Venue,
  VenueCreateInput,
  VenueUpdateInput,
  VenueListItem,
  VenueAnalytics,
  VenueReview,
  VenueRating,
  VenueRatingCreateInput,
  VenueRatingUpdateInput,
  VenueComment,
  VenueCommentCreateInput,
  VenueRecommendation,
  VenueBadge,
  VenueSortBy,
  VenueFilter,
  RatingSortBy,
  VenuesListResponse,
  VenueRatingsResponse,
  VenueRecommendationsResponse,
  VenueDashboard,
} from './venue-types';

// Helper function to get Supabase client
const getSupabaseServerClient = async () => createSupabaseServerClient();

// Type definitions for Supabase query results
interface VenueRow {
  id: string;
  group_id: string;
  name: string;
  slug: string;
  address: string;
  website: string | null;
  phone: string | null;
  num_courts: number;
  surface_type: 'glass' | 'cement' | 'artificial_grass' | 'other';
  indoor_outdoor: 'indoor' | 'outdoor' | 'both';
  lighting: 'led' | 'fluorescent' | 'natural' | 'none';
  climate_control: boolean;
  has_showers: boolean;
  has_changing_rooms: boolean;
  has_lockers: boolean;
  has_parking: boolean;
  has_bar_restaurant: boolean;
  has_water_fountain: boolean;
  has_wifi: boolean;
  has_equipment_rental: boolean;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  venue_analytics: VenueAnalytics;
}

interface VenueAnalyticsRow {
  venue_id: string;
  group_id: string;
  name: string;
  slug: string;
  total_ratings: number;
  avg_overall_rating: number;
  avg_court_quality: number;
  avg_lighting: number;
  avg_comfort: number;
  avg_amenities: number;
  avg_accessibility: number;
  avg_atmosphere: number;
  total_helpful_votes: number;
  total_not_helpful_votes: number;
  total_comments: number;
  last_rating_at: string | null;
  last_updated_at: string;
}

interface RatingRow {
  id: string;
  venue_id: string;
  player_id: string;
  group_id: string;
  court_quality: number;
  lighting: number;
  comfort: number;
  amenities: number;
  accessibility: number;
  atmosphere: number;
  overall_rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  player: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  helpful_votes: Array<{ id: string; is_helpful: boolean; voter_id: string }>;
  comments: Array<{
    id: string;
    rating_id: string;
    player_id: string;
    comment_text: string;
    created_at: string;
    updated_at: string;
    player: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  }>;
}

interface HelpfulVote {
  is_helpful: boolean;
}

// ============================================================================
// Venue CRUD Operations
// ============================================================================

/**
 * Create a new venue
 */
export async function createVenue(input: VenueCreateInput): Promise<Venue> {
  const supabaseServer = await getSupabaseServerClient();

  // Generate slug from name
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data, error } = await supabaseServer
    .from('venues')
    .insert({
      ...input,
      slug,
      created_by: input.group_id, // Will be replaced by actual player_id in RLS
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create venue: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing venue
 */
export async function updateVenue(
  id: string,
  updates: VenueUpdateInput
): Promise<Venue> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venues')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update venue: ${error.message}`);
  }

  return data;
}

/**
 * Delete a venue
 */
export async function deleteVenue(id: string): Promise<void> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer.from('venues').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete venue: ${error.message}`);
  }
}

/**
 * Get venue by ID
 */
export async function getVenueById(id: string): Promise<Venue | null> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Failed to fetch venue: ${error.message}`);
  }

  return data;
}

/**
 * Get venue by slug and group ID
 */
export async function getVenueBySlug(
  slug: string,
  groupId: string
): Promise<Venue | null> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .eq('group_id', groupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch venue: ${error.message}`);
  }

  return data;
}

// ============================================================================
// Venue Listing
// ============================================================================

/**
 * List venues with filters and sorting
 */
export async function listVenues(
  groupId: string,
  options: {
    sortBy?: VenueSortBy;
    filters?: VenueFilter;
    page?: number;
    limit?: number;
  } = {}
): Promise<VenuesListResponse> {
  const supabaseServer = await getSupabaseServerClient();
  const { sortBy = 'name', filters = {}, page = 1, limit = 20 } = options;

  // Start query
  let query = supabaseServer
    .from('venues')
    .select(`
      *,
      venue_analytics!inner (
        total_ratings,
        avg_overall_rating
      )
    `, { count: 'exact' })
    .eq('group_id', groupId);

  // Apply filters
  if (filters.surface_type) {
    query = query.eq('surface_type', filters.surface_type);
  }

  if (filters.indoor_outdoor) {
    query = query.eq('indoor_outdoor', filters.indoor_outdoor);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
  }

  if (filters.min_rating) {
    query = query.gte('venue_analytics.avg_overall_rating', filters.min_rating);
  }

  if (filters.has_amenities && filters.has_amenities.length > 0) {
    // Filter by amenities (all must be true)
    for (const amenity of filters.has_amenities) {
      query = query.eq(`has_${amenity}`, true);
    }
  }

  // Apply sorting
  switch (sortBy) {
    case 'rating':
      query = query.order('venue_analytics.avg_overall_rating', {
        ascending: false,
        referencedTable: 'venue_analytics',
      });
      break;
    case 'most_played':
      query = query.order('venue_analytics.total_ratings', {
        ascending: false,
        referencedTable: 'venue_analytics',
      });
      break;
    case 'recently_added':
      query = query.order('created_at', { ascending: false });
      break;
    case 'last_played':
      query = query.order('venue_analytics.last_rating_at', {
        ascending: false,
        referencedTable: 'venue_analytics',
      });
      break;
    case 'name':
    default:
      query = query.order('name', { ascending: true });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list venues: ${error.message}`);
  }

  // Map to VenueListItem format
  const venues: VenueListItem[] = (data as VenueRow[] || []).map((item) => ({
    venue: {
      id: item.id,
      group_id: item.group_id,
      name: item.name,
      slug: item.slug,
      address: item.address,
      website: item.website,
      phone: item.phone,
      num_courts: item.num_courts,
      surface_type: item.surface_type,
      indoor_outdoor: item.indoor_outdoor,
      lighting: item.lighting,
      climate_control: item.climate_control,
      has_showers: item.has_showers,
      has_changing_rooms: item.has_changing_rooms,
      has_lockers: item.has_lockers,
      has_parking: item.has_parking,
      has_bar_restaurant: item.has_bar_restaurant,
      has_water_fountain: item.has_water_fountain,
      has_wifi: item.has_wifi,
      has_equipment_rental: item.has_equipment_rental,
      photos: item.photos || [],
      created_at: item.created_at,
      updated_at: item.updated_at,
      created_by: item.created_by,
    },
    analytics: item.venue_analytics,
    last_played_at: item.venue_analytics.last_rating_at,
    matches_played: item.venue_analytics.total_ratings, // Approximation
  }));

  return {
    venues,
    total: count || 0,
    page,
    limit,
  };
}

// ============================================================================
// Venue Ratings
// ============================================================================

/**
 * Submit a venue rating
 */
export async function createVenueRating(
  input: VenueRatingCreateInput
): Promise<VenueRating> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venue_ratings')
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create rating: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing rating
 */
export async function updateVenueRating(
  ratingId: string,
  updates: VenueRatingUpdateInput
): Promise<VenueRating> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venue_ratings')
    .update(updates)
    .eq('id', ratingId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update rating: ${error.message}`);
  }

  return data;
}

/**
 * Delete a rating
 */
export async function deleteVenueRating(ratingId: string): Promise<void> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer
    .from('venue_ratings')
    .delete()
    .eq('id', ratingId);

  if (error) {
    throw new Error(`Failed to delete rating: ${error.message}`);
  }
}

/**
 * Get current user's rating for a venue
 */
export async function getMyVenueRating(
  venueId: string,
  playerId: string
): Promise<VenueRating | null> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venue_ratings')
    .select('*')
    .eq('venue_id', venueId)
    .eq('player_id', playerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch rating: ${error.message}`);
  }

  return data;
}

/**
 * Get all ratings for a venue
 */
export async function getVenueRatings(
  venueId: string,
  options: {
    sortBy?: RatingSortBy;
    page?: number;
    limit?: number;
  } = {}
): Promise<VenueRatingsResponse> {
  const supabaseServer = await getSupabaseServerClient();
  const { sortBy = 'helpful', page = 1, limit = 10 } = options;

  // Get ratings with player info and helpful votes
  let query = supabaseServer
    .from('venue_ratings')
    .select(`
      *,
      player:player_id (
        id,
        name,
        avatar_url
      ),
      helpful_votes:venue_rating_helpful_votes (
        id,
        is_helpful,
        voter_id
      ),
      comments:venue_comments (
        id,
        player_id,
        comment_text,
        created_at
      )
    `, { count: 'exact' })
    .eq('venue_id', venueId);

  // Apply sorting
  switch (sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false });
      break;
    case 'highest_rated':
      query = query.order('overall_rating', { ascending: false });
      break;
    case 'lowest_rated':
      query = query.order('overall_rating', { ascending: true });
      break;
    case 'helpful':
    default:
      // Helpful sorting requires post-processing
      query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch ratings: ${error.message}`);
  }

  // Process data into VenueReview format
  const ratings: VenueReview[] = (data as RatingRow[] || []).map((item) => ({
    ...item,
    player: item.player,
    helpful_votes: {
      helpful: item.helpful_votes.filter((v: HelpfulVote) => v.is_helpful).length,
      not_helpful: item.helpful_votes.filter((v: HelpfulVote) => !v.is_helpful).length,
    },
    user_vote: null as 'helpful' | 'not_helpful' | null,
    comments: item.comments || [],
  }));

  // Calculate average ratings
  const allRatings = (data || []) as RatingRow[];
  const calculateAverage = (field: keyof RatingRow) => {
    const sum = allRatings.reduce((acc: number, r: RatingRow) => acc + (r[field] as number), 0);
    return sum > 0 ? Math.round((sum / allRatings.length) * 10) / 10 : 0;
  };

  const average = {
    overall: calculateAverage('overall_rating'),
    court_quality: calculateAverage('court_quality'),
    lighting: calculateAverage('lighting'),
    comfort: calculateAverage('comfort'),
    amenities: calculateAverage('amenities'),
    accessibility: calculateAverage('accessibility'),
    atmosphere: calculateAverage('atmosphere'),
  };

  return {
    ratings,
    total: count || 0,
    average,
    your_rating: null,
  };
}

// ============================================================================
// Venue Comments
// ============================================================================

/**
 * Add a comment to a review
 */
export async function createVenueComment(
  input: VenueCommentCreateInput
): Promise<VenueComment> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venue_comments')
    .insert(input)
    .select(`
      *,
      player:player_id (
        id,
        name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  return data;
}

/**
 * Delete a comment
 */
export async function deleteVenueComment(commentId: string): Promise<void> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer
    .from('venue_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}

// ============================================================================
// Helpful Votes
// ============================================================================

/**
 * Vote on a review as helpful or not helpful
 */
export async function voteOnReview(
  ratingId: string,
  playerId: string,
  groupId: string,
  isHelpful: boolean
): Promise<void> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer
    .from('venue_rating_helpful_votes')
    .upsert(
      {
        rating_id: ratingId,
        voter_id: playerId,
        group_id: groupId,
        is_helpful: isHelpful,
      },
      { onConflict: 'rating_id,voter_id' }
    );

  if (error) {
    throw new Error(`Failed to vote on review: ${error.message}`);
  }
}

/**
 * Remove vote on a review
 */
export async function removeVoteOnReview(ratingId: string, playerId: string): Promise<void> {
  const supabaseServer = await getSupabaseServerClient();

  const { error } = await supabaseServer
    .from('venue_rating_helpful_votes')
    .delete()
    .eq('rating_id', ratingId)
    .eq('voter_id', playerId);

  if (error) {
    throw new Error(`Failed to remove vote: ${error.message}`);
  }
}

// ============================================================================
// Venue Analytics
// ============================================================================

/**
 * Get venue analytics
 */
export async function getVenueAnalytics(
  venueId: string
): Promise<VenueAnalytics | null> {
  const supabaseServer = await getSupabaseServerClient();

  const { data, error } = await supabaseServer
    .from('venue_analytics')
    .select('*')
    .eq('venue_id', venueId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }

  return data;
}

/**
 * Get venue dashboard analytics (admin)
 */
export async function getVenueDashboard(
  groupId: string
): Promise<VenueDashboard> {
  const supabaseServer = await getSupabaseServerClient();

  // Get all venue analytics for the group
  const { data: analytics, error } = await supabaseServer
    .from('venue_analytics')
    .select('*')
    .eq('group_id', groupId);

  if (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }

  return {
    attendance_by_venue: [],
    average_ratings_by_venue: (analytics || []).map((a: VenueAnalyticsRow) => ({
      venue_id: a.venue_id,
      venue_name: a.name,
      avg_overall_rating: a.avg_overall_rating,
      total_ratings: a.total_ratings,
    })),
    matches_by_venue: [],
    satisfaction_trends: [],
  };
}

// ============================================================================
// Venue Recommendations
// ============================================================================

/**
 * Get venue recommendations
 */
export async function getVenueRecommendations(
  groupId: string
): Promise<VenueRecommendationsResponse> {
  const supabaseServer = await getSupabaseServerClient();

  // Get all venues with analytics
  const { data: venues, error } = await supabaseServer
    .from('venues')
    .select(`
      *,
      venue_analytics!inner (*)
    `)
    .eq('group_id', groupId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch venues: ${error.message}`);
  }

  // Calculate badges
  const recommendations: VenueRecommendation[] = (venues as unknown as VenueRow[] || []).map(
    (item) => {
      const badges: VenueBadge[] = [];
      const analytics = item.venue_analytics;

      if (analytics.avg_overall_rating >= 4.5 && analytics.total_ratings >= 3) {
        badges.push('top_rated');
      }
      if (analytics.avg_overall_rating >= 4.0 && analytics.total_ratings >= 5) {
        badges.push('group_favorite');
      }

      return {
        venue: {
          id: item.id,
          group_id: item.group_id,
          name: item.name,
          slug: item.slug,
          address: item.address,
          website: item.website,
          phone: item.phone,
          num_courts: item.num_courts,
          surface_type: item.surface_type,
          indoor_outdoor: item.indoor_outdoor,
          lighting: item.lighting,
          climate_control: item.climate_control,
          has_showers: item.has_showers,
          has_changing_rooms: item.has_changing_rooms,
          has_lockers: item.has_lockers,
          has_parking: item.has_parking,
          has_bar_restaurant: item.has_bar_restaurant,
          has_water_fountain: item.has_water_fountain,
          has_wifi: item.has_wifi,
          has_equipment_rental: item.has_equipment_rental,
          photos: item.photos || [],
          created_at: item.created_at,
          updated_at: item.updated_at,
          created_by: item.created_by,
        },
        analytics,
        badges,
      };
    }
  );

  return {
    top_rated: recommendations.filter((r) => r.badges.includes('top_rated')),
    best_attendance: [], // TODO: Implement when match-venue linking is ready
    most_played: [], // TODO: Implement when match-venue linking is ready
    personalized: [],
  };
}
