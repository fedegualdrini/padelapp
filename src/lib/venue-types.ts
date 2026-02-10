// ============================================================================
// Venue & Court Rating System Types
// ============================================================================

// ============================================================================
// Venue Types
// ============================================================================

export type SurfaceType = 'glass' | 'cement' | 'artificial_grass' | 'other';

export type IndoorOutdoor = 'indoor' | 'outdoor' | 'both';

export type LightingType = 'led' | 'fluorescent' | 'natural' | 'none';

export interface Venue {
  id: string;
  group_id: string;
  name: string;
  slug: string;
  address: string;
  website: string | null;
  phone: string | null;
  num_courts: number;
  surface_type: SurfaceType;
  indoor_outdoor: IndoorOutdoor;
  lighting: LightingType;
  climate_control: boolean;
  has_showers: boolean;
  has_changing_rooms: boolean;
  has_lockers: boolean;
  has_parking: boolean;
  has_bar_restaurant: boolean;
  has_water_fountain: boolean;
  has_wifi: boolean;
  has_equipment_rental: boolean;
  photos: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface VenueCreateInput {
  group_id: string;
  name: string;
  address: string;
  website?: string;
  phone?: string;
  num_courts: number;
  surface_type: SurfaceType;
  indoor_outdoor: IndoorOutdoor;
  lighting: LightingType;
  climate_control?: boolean;
  has_showers?: boolean;
  has_changing_rooms?: boolean;
  has_lockers?: boolean;
  has_parking?: boolean;
  has_bar_restaurant?: boolean;
  has_water_fountain?: boolean;
  has_wifi?: boolean;
  has_equipment_rental?: boolean;
  photos?: string[];
}

export type VenueUpdateInput = Partial<Omit<VenueCreateInput, 'group_id'>>;

// ============================================================================
// Venue Rating Types
// ============================================================================

export interface VenueRating {
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
}

export interface VenueRatingWithUser extends VenueRating {
  player: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface VenueRatingCreateInput {
  venue_id: string;
  player_id: string;
  group_id: string;
  court_quality: number;
  lighting: number;
  comfort: number;
  amenities: number;
  accessibility: number;
  atmosphere: number;
  review_text?: string;
}

export type VenueRatingUpdateInput = Partial<
  Pick<
    VenueRatingCreateInput,
    | 'court_quality'
    | 'lighting'
    | 'comfort'
    | 'amenities'
    | 'accessibility'
    | 'atmosphere'
    | 'review_text'
  >
>;

// ============================================================================
// Venue Analytics Types
// ============================================================================

export interface VenueAnalytics {
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

export interface VenueRatingBreakdown {
  overall: number;
  court_quality: number;
  lighting: number;
  comfort: number;
  amenities: number;
  accessibility: number;
  atmosphere: number;
}

// ============================================================================
// Venue Review Types
// ============================================================================

export interface VenueReview extends VenueRatingWithUser {
  helpful_votes: {
    helpful: number;
    not_helpful: number;
  };
  user_vote: 'helpful' | 'not_helpful' | null;
  comments: VenueComment[];
}

export interface VenueComment {
  id: string;
  rating_id: string;
  player_id: string;
  player: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  comment_text: string;
  created_at: string;
  updated_at: string;
}

export interface VenueCommentCreateInput {
  rating_id: string;
  player_id: string;
  group_id: string;
  comment_text: string;
}

// ============================================================================
// Venue Recommendation Types
// ============================================================================

export interface VenueRecommendation {
  venue: Venue;
  analytics: VenueAnalytics;
  badges: VenueBadge[];
}

export type VenueBadge = 'top_rated' | 'best_attendance' | 'most_played' | 'group_favorite';

// ============================================================================
// Venue List & Detail Types
// ============================================================================

export interface VenueListItem {
  venue: Venue;
  analytics: VenueAnalytics;
  last_played_at: string | null;
  matches_played: number;
}

export interface VenueDetail extends VenueListItem {
  reviews: VenueReview[];
  rating_breakdown: VenueRatingBreakdown;
  your_rating: VenueRating | null;
}

// ============================================================================
// Venue Stats Types
// ============================================================================

export interface VenueAttendanceStats {
  venue_id: string;
  venue_name: string;
  avg_attendance_rate: number;
  total_events: number;
}

export interface VenueUsageStats {
  venue_id: string;
  venue_name: string;
  matches_played: number;
  trend: number; // positive/negative percentage change
}

export interface VenueSatisfactionTrend {
  venue_id: string;
  venue_name: string;
  date: string;
  avg_rating: number;
}

// ============================================================================
// Venue Dashboard Types
// ============================================================================

export interface VenueDashboard {
  attendance_by_venue: VenueAttendanceStats[];
  average_ratings_by_venue: VenueRatingStats[];
  matches_by_venue: VenueUsageStats[];
  satisfaction_trends: VenueSatisfactionTrend[];
}

export interface VenueRatingStats {
  venue_id: string;
  venue_name: string;
  avg_overall_rating: number;
  total_ratings: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface VenuesListResponse {
  venues: VenueListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface VenueRatingsResponse {
  ratings: VenueReview[];
  total: number;
  average: VenueRatingBreakdown;
  your_rating: VenueRating | null;
}

export interface VenueRecommendationsResponse {
  top_rated: VenueRecommendation[];
  best_attendance: VenueRecommendation[];
  most_played: VenueRecommendation[];
  personalized: VenueRecommendation[];
}

// ============================================================================
// Sort & Filter Types
// ============================================================================

export type VenueSortBy = 'rating' | 'name' | 'most_played' | 'recently_added' | 'last_played';

export type VenueFilter = {
  surface_type?: SurfaceType;
  indoor_outdoor?: IndoorOutdoor;
  search?: string;
  min_rating?: number;
  has_amenities?: string[]; // ['showers', 'parking', 'bar_restaurant']
};

export type RatingSortBy = 'helpful' | 'recent' | 'highest_rated' | 'lowest_rated';
