# Feature: Smart Court & Venue Rating System

**STATUS:** IMPLEMENTED  
**Commit:** e6e895cd465c222a04adb033f8db93e03973b965  
**Date:** 2026-01-30

## Summary
A comprehensive venue and court rating system where group members can rate and review the courts they play at. Track venue quality, surface type, lighting conditions, amenities, and more. Build collective intelligence about where to play, helping groups make better decisions for events and matches. Include venue-based analytics to understand which venues yield better match experiences and attendance.

## Background

Padel courts vary dramatically in quality. Even within the same city, factors like:
- **Surface type**: Glass, cement, artificial grass (each affects ball speed and play)
- **Lighting**: Indoor vs outdoor, LED vs fluorescent, brightness levels
- **Temperature**: Indoor climate control vs outdoor weather dependency
- **Net quality**: Official height and tension vs sagging/near-miss
- **Amenities**: Showers, changing rooms, locker access, bar/restaurant
- **Accessibility**: Parking, public transport, proximity to members
- **Noise level**: Indoor echo vs outdoor ambient noise
- **Seating**: Spectator comfort and viewing angles

Currently, Padelapp tracks matches and events but has no venue intelligence. Groups play at multiple venues but can't easily:
- Remember which courts were good/bad
- Share venue knowledge with new members
- Make data-driven decisions about where to play
- Track which venues produce better attendance
- See venue preferences across the group

**Why this matters:**
A bad venue can ruin a great padel session. Poor lighting, slippery surfaces, or noisy environments affect both performance and enjoyment. A venue rating system turns individual experiences into group intelligence, making every future event better informed.

## User Stories

### As a player, I want to:
- Rate courts I've played at (1-5 stars) across multiple dimensions
- Write reviews about venues (pros/cons, tips for other players)
- See aggregate ratings from my group before agreeing to play somewhere
- Set venue preferences (e.g., "prefer indoor courts", "avoid venues without showers")
- Find out which venues have the best attendance and player satisfaction

### As a group admin, I want to:
- Create and manage venue profiles for places we play
- See which venues have the highest player satisfaction
- Track attendance rates by venue (do people skip when it's at certain venues?)
- Filter events by venue type when planning
- Get recommendations on which venues to book based on group preferences

### As a group, I want to:
- Build a shared knowledge base of venues
- Make collective decisions about where to play
- Discover new venues from other groups (future enhancement)
- Avoid venues that consistently get poor ratings

## Core Features

### 1. Venue Profile Management
**Create/Edit Venue:**
- Fields:
  - Name (required)
  - Address/location (required, with map integration)
  - Website (optional)
  - Phone number (optional)
  - Number of courts (required)
  - Surface type: Glass / Cement / Artificial grass / Other (required)
  - Indoor/outdoor: Indoor / Outdoor / Both (required)
  - Lighting: LED / Fluorescent / Natural / None (required)
  - Climate control: Yes / No
  - Amenities (checkboxes):
    - Showers
    - Changing rooms
    - Lockers
    - Parking
    - Bar/Restaurant
    - Water fountain
    - Wi-Fi
    - Equipment rental
  - Photos (optional, up to 5 images)
- Venue slug auto-generated from name (e.g., "club-padel-madrid")

**Venue Listing:**
- Group-only venues (not cross-group by default)
- List view: `/g/[slug]/venues`
- Card shows:
  - Name and address
  - Aggregate rating (stars + count)
  - Key attributes (indoor/outdoor, surface type)
  - Last played date
  - Matches played count
  - "View details" button

**Venue Detail Page:**
- `/g/[slug]/venues/[venue-slug]`
- Sections:
  - Overview card (all venue attributes)
  - Aggregate ratings (breakdown by dimension)
  - Recent reviews (with ratings breakdown)
  - Match history at this venue (with dates and outcomes)
  - Attendance statistics (by day/time)
  - "Rate this venue" button (for users who haven't rated)

### 2. Multi-Dimensional Rating System

**Rating Dimensions (1-5 stars each):**
1. **Court Quality**: Surface condition, net quality, court lines
2. **Lighting**: Brightness, glare, consistency
3. **Comfort**: Temperature, ventilation, seating
4. **Amenities**: Showers, changing rooms, parking, food
5. **Accessibility**: Parking, public transport, ease of finding
6. **Atmosphere**: Noise level, crowd, vibe

**Overall Rating:**
- Weighted average: Court Quality (30%) + Lighting (20%) + Comfort (15%) + Amenities (15%) + Accessibility (10%) + Atmosphere (10%)
- Displayed as stars with decimal (e.g., "4.3 ★")

**Rating UI:**
- Star rating slider with dimension toggles
- Optional text review (min 10 characters, max 500)
- One rating per user per venue
- Ratings can be edited anytime
- Show "Your rating" on venue detail page

### 3. Venue-Based Analytics

**Attendance by Venue:**
- Show attendance rate for events held at each venue
- Compare RSVP vs actual attendance
- Identify venues with high no-show rates

**Player Satisfaction by Venue:**
- Aggregate ratings by venue
- Track satisfaction trends over time
- Highlight venues with declining ratings

**Venue Usage Trends:**
- Most frequently used venues
- Seasonal patterns (e.g., indoor venues more popular in winter)
- Time slot preferences by venue

**Venue Performance Dashboard:**
- `/g/[slug]/admin/venue-analytics` (admin-only)
- Charts showing:
  - Attendance rate by venue (bar chart)
  - Average rating by venue (bar chart)
  - Matches played per venue (line chart over time)
  - Satisfaction trends (line chart over 6 months)

### 4. Venue Recommendations

**Smart Event Venue Suggestions:**
- When creating an event, suggest venues based on:
  - Group average ratings
  - Attendance history
  - Member preferences (if available)
  - Day/time availability (future: venue booking integration)
- Display: "Recommended venues" section with badges:
  - "Top rated" (4.5+ stars)
  - "Best attendance" (90%+ RSVP attendance)
  - "Group favorite" (most played)

**Personalized Venue Preferences** (v2 feature):
- Per-player preference settings:
  - Preferred surface type
  - Indoor/outdoor preference
  - Minimum amenities required
  - Max travel distance (if location data available)
- When RSVPing to events, show preference match indicator

### 5. Venue Reviews & Comments

**Review Display:**
- Sort options: Most helpful, Recent, Highest rated
- Each review shows:
  - User name + avatar
  - Date played
  - Star ratings (all dimensions shown)
  - Text review
  - Helpful votes (up/down)
  - Reply from venue (optional, future)

**Helpful Voting:**
- Users can vote reviews as "helpful" or "not helpful"
- Helpful reviews appear higher in sort
- Prevent self-voting and duplicate voting

**Review Replies:**
- Other members can comment on reviews
- Creates discussion around venues
- Reply threading similar to match comments

## Data Model Changes

```sql
-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  website VARCHAR(255),
  phone VARCHAR(50),
  num_courts INTEGER NOT NULL,
  surface_type VARCHAR(50) NOT NULL, -- 'glass', 'cement', 'artificial_grass', 'other'
  indoor_outdoor VARCHAR(20) NOT NULL, -- 'indoor', 'outdoor', 'both'
  lighting VARCHAR(50) NOT NULL, -- 'led', 'fluorescent', 'natural', 'none'
  climate_control BOOLEAN NOT NULL DEFAULT FALSE,
  has_showers BOOLEAN NOT NULL DEFAULT FALSE,
  has_changing_rooms BOOLEAN NOT NULL DEFAULT FALSE,
  has_lockers BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking BOOLEAN NOT NULL DEFAULT FALSE,
  has_bar_restaurant BOOLEAN NOT NULL DEFAULT FALSE,
  has_water_fountain BOOLEAN NOT NULL DEFAULT FALSE,
  has_wifi BOOLEAN NOT NULL DEFAULT FALSE,
  has_equipment_rental BOOLEAN NOT NULL DEFAULT FALSE,
  photos JSONB DEFAULT '[]', -- array of image URLs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES players(id),
  UNIQUE(group_id, slug)
);

-- Indexes
CREATE INDEX idx_venues_group ON venues(group_id);
CREATE INDEX idx_venues_slug ON venues(slug);

-- Venue ratings
CREATE TABLE venue_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  court_quality INTEGER NOT NULL CHECK (court_quality BETWEEN 1 AND 5),
  lighting INTEGER NOT NULL CHECK (lighting BETWEEN 1 AND 5),
  comfort INTEGER NOT NULL CHECK (comfort BETWEEN 1 AND 5),
  amenities INTEGER NOT NULL CHECK (amenities BETWEEN 1 AND 5),
  accessibility INTEGER NOT NULL CHECK (accessibility BETWEEN 1 AND 5),
  atmosphere INTEGER NOT NULL CHECK (atmosphere BETWEEN 1 AND 5),
  overall_rating NUMERIC(3,1) GENERATED ALWAYS AS (
    (court_quality * 0.3) +
    (lighting * 0.2) +
    (comfort * 0.15) +
    (amenities * 0.15) +
    (accessibility * 0.1) +
    (atmosphere * 0.1)
  ) STORED,
  review_text TEXT CHECK (LENGTH(review_text) BETWEEN 10 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(venue_id, player_id)
);

-- Indexes
CREATE INDEX idx_venue_ratings_venue ON venue_ratings(venue_id);
CREATE INDEX idx_venue_ratings_player ON venue_ratings(player_id);
CREATE INDEX idx_venue_ratings_group ON venue_ratings(group_id);

-- Venue helpful votes
CREATE TABLE venue_rating_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES venue_ratings(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rating_id, voter_id)
);

-- Venue comments (replies to reviews)
CREATE TABLE venue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES venue_ratings(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (LENGTH(comment_text) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link matches to venues (optional, if you want to track which matches were where)
ALTER TABLE matches ADD COLUMN venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

-- Venue analytics materialized view
CREATE MATERIALIZED VIEW venue_analytics AS
SELECT
  v.id AS venue_id,
  v.group_id,
  v.name,
  v.slug,
  COUNT(DISTINCT m.id) AS matches_played,
  COUNT(DISTINCT r.id) AS total_ratings,
  AVG(r.overall_rating) AS avg_overall_rating,
  AVG(r.court_quality) AS avg_court_quality,
  AVG(r.lighting) AS avg_lighting,
  AVG(r.comfort) AS avg_comfort,
  AVG(r.amenities) AS avg_amenities,
  AVG(r.accessibility) AS avg_accessibility,
  AVG(r.atmosphere) AS avg_atmosphere,
  -- Attendance stats (if match-venue link exists)
  COALESCE(AVG(
    CASE
      WHEN e.max_attendance > 0 THEN (e.actual_attendance::FLOAT / e.max_attendance) * 100
      ELSE NULL
    END
  ), NULL) AS avg_attendance_rate_pct
FROM venues v
LEFT JOIN venue_ratings r ON r.venue_id = v.id
LEFT JOIN matches m ON m.venue_id = v.id
LEFT JOIN events e ON e.venue_id = v.id AND e.status = 'completed'
GROUP BY v.id, v.group_id, v.name, v.slug;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_venue_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY venue_analytics;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh after rating changes
CREATE TRIGGER trigger_refresh_venue_analytics
  AFTER INSERT OR UPDATE OR DELETE ON venue_ratings
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_venue_analytics();
```

## API Endpoints

### Venues

```typescript
// GET /api/venues - List venues in group
GET /api/venues?group_id=xxx&sort_by=rating&limit=20

Response: {
  venues: Venue[],
  total: number
}

// GET /api/venues/:id - Get venue details
GET /api/venues/123

Response: VenueDetail

// POST /api/venues - Create new venue
POST /api/venues
Body: {
  name: string,
  address: string,
  // ... other venue fields
}

Response: Venue

// PUT /api/venues/:id - Update venue
PUT /api/venues/123
Body: Partial<Venue>

Response: Venue

// DELETE /api/venues/:id - Delete venue
DELETE /api/venues/123
Response: { success: true }
```

### Ratings

```typescript
// GET /api/venues/:id/ratings - Get all ratings for venue
GET /api/venues/123/ratings?sort_by=helpful

Response: {
  ratings: VenueRatingWithUser[],
  total: number,
  average: {
    overall: 4.3,
    courtQuality: 4.5,
    lighting: 4.0,
    // ... other dimensions
  }
}

// GET /api/venues/:id/ratings/my-rating - Get current user's rating
GET /api/venues/123/ratings/my-rating

Response: VenueRating | null

// POST /api/venues/:id/ratings - Submit rating
POST /api/venues/123/ratings
Body: {
  courtQuality: number,
  lighting: number,
  comfort: number,
  amenities: number,
  accessibility: number,
  atmosphere: number,
  reviewText?: string
}

Response: VenueRating

// PUT /api/venues/:id/ratings/:rating_id - Update rating
PUT /api/venues/123/ratings/456
Body: Partial<RatingFields>

Response: VenueRating

// DELETE /api/venues/:id/ratings/:rating_id - Delete rating
DELETE /api/venues/123/ratings/456
Response: { success: true }
```

### Analytics

```typescript
// GET /api/venues/analytics - Get venue analytics (admin)
GET /api/venues/analytics?group_id=xxx

Response: {
  attendanceByVenue: VenueAttendance[],
  averageRatingsByVenue: VenueRatingStats[],
  matchesByVenue: VenueUsageStats[],
  satisfactionTrends: SatisfactionTrend[]
}

// GET /api/venues/:id/analytics - Get specific venue analytics
GET /api/venues/123/analytics

Response: VenueAnalytics {
  venueId: string,
  matchesPlayed: number,
  totalRatings: number,
  averageRating: number,
  averageAttendanceRate: number,
  ratingBreakdown: {
    courtQuality: number,
    lighting: number,
    // ... other dimensions
  },
  lastPlayedAt: timestamp,
  lastRatingAt: timestamp
}
```

### Recommendations

```typescript
// GET /api/venues/recommendations - Get venue suggestions
GET /api/venues/recommendations?group_id=xxx

Response: {
  topRated: Venue[],
  bestAttendance: Venue[],
  mostPlayed: Venue[],
  personalized: Venue[] // if user preferences exist
}
```

## Frontend Components

### `VenueCard`
Compact card for venue listing:
- Name and address (truncated)
- Overall rating with stars
- Badges for key attributes (indoor, glass, etc.)
- Last played: "Played 2 days ago"
- "View details" button

### `VenueList`
Page: `/g/[slug]/venues`
- Grid of venue cards
- Sort/filter controls:
  - Sort by: Rating, Most played, Recently added
  - Filter by: Surface type, Indoor/outdoor
  - Search by name/address
- Create new venue button (admin)

### `VenueDetail`
Page: `/g/[slug]/venues/[slug]`
- Overview section (all venue attributes with icons)
- Aggregate ratings display (star breakdown by dimension)
- "Rate this venue" button (opens rating modal)
- Recent reviews section
- Match history at this venue
- Edit venue button (admin)

### `VenueRatingModal`
Modal for submitting/editing ratings:
- Star sliders for each dimension (1-5)
- Optional text review
- Submit button
- Validation: All dimensions required
- Character counter for review text

### `VenueReviewCard`
Individual review card:
- User avatar + name + date played
- Star ratings breakdown (mini display)
- Full review text
- Helpful voting buttons (👍 / 👎)
- Helpful vote count
- "Reply" button (opens comment input)

### `VenueAnalyticsDashboard`
Admin-only page: `/g/[slug]/admin/venue-analytics`
- Chart: Attendance rate by venue (bar)
- Chart: Average rating by venue (bar)
- Chart: Matches per venue (line, last 6 months)
- Chart: Rating trends over time (line)
- Table: Venue performance summary
- Date range filter

### `VenueRecommendations`
Component for event creation/edit:
- "Recommended venues" section
- Cards with badges:
  - "⭐ Top rated" (4.5+ stars)
  - "👥 Best attendance" (90%+)
  - "🎾 Most played"
- Click to select venue for event

## UI/UX Design

### Venue Card Design
```
┌─────────────────────────────────────────┐
│ Club Padel Madrid ⭐ 4.3 (12)           │
│ 📍 Calle del Padel, 123                  │
│                                         │
│ 🏟️ Indoor • 🧱 Glass • 💡 LED            │
│                                         │
│ Played 2 days ago • 24 matches          │
│                                         │
│ [View details]                          │
└─────────────────────────────────────────┘
```

### Venue Detail Page
```
┌─────────────────────────────────────────┐
│ Club Padel Madrid                       │
│ 📍 Calle del Padel, 123, Madrid         │
│                                         │
│ Overview                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Type: Indoor • Glass surface            │
│ Courts: 6 courts                        │
│ Lighting: LED                           │
│ Climate: ✅ Controlled                  │
│ Amenities: Showers • Parking • Bar     │
│                                         │
│ Ratings (12 reviews)                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Overall: ⭐⭐⭐⭐☆ 4.3                   │
│ Court quality: ⭐⭐⭐⭐⭐ 4.8              │
│ Lighting: ⭐⭐⭐⭐☆ 4.2                   │
│ Comfort: ⭐⭐⭐⭐☆ 4.5                    │
│ Amenities: ⭐⭐⭐⭐☆ 4.1                  │
│ Accessibility: ⭐⭐⭐☆☆ 3.8              │
│ Atmosphere: ⭐⭐⭐⭐☆ 4.5                 │
│                                         │
│ [Rate this venue]                       │
│                                         │
│ Recent Reviews                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Alice • Played Jan 25                   │
│ ⭐⭐⭐⭐⭐ Court quality, ⭐⭐⭐ Lighting  │
│ "Great courts, but lighting could be   │
│  brighter on court 3."                  │
│                                         │
│ 👍 Helpful (5) | [Reply]                │
│                                         │
│ Bob • Played Jan 20                     │
│ ⭐⭐⭐⭐⭐ All dimensions 5 stars        │
│ "Best venue in the city! Professional  │
│  staff, excellent courts."              │
│                                         │
│ 👍 Helpful (12) | [Reply]               │
│                                         │
│ [View all 12 reviews]                   │
└─────────────────────────────────────────┘
```

### Rating Modal
```
┌─────────────────────────────────────────┐
│ Rate: Club Padel Madrid                 │
│                                         │
│ Court quality ⭐⭐⭐⭐☆                   │
│ Lighting       ⭐⭐⭐⭐☆                   │
│ Comfort        ⭐⭐⭐⭐☆                   │
│ Amenities      ⭐⭐⭐⭐☆                   │
│ Accessibility  ⭐⭐⭐☆☆                   │
│ Atmosphere     ⭐⭐⭐⭐☆                   │
│                                         │
│ [Optional: Write a review]              │
│ ┌─────────────────────────────────────┐ │
│ │ Share your experience...           │ │
│ │ [46/500 characters]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                     [Cancel] [Submit]   │
└─────────────────────────────────────────┘
```

### Venue Recommendations (Event Creation)
```
┌─────────────────────────────────────────┐
│ Venue for this event                    │
│                                         │
│ Recommended venues                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│ Club Padel Madrid ⭐ 4.5 ⭐ Top rated    │
│ Best attendance: 95%                    │
│ [Select venue]                          │
│                                         │
│ Padel Center Norte ⭐ 4.2 👥 Best att.   │
│ Attendance: 93%                         │
│ [Select venue]                          │
│                                         │
│ [Browse all venues]                     │
│                                         │
└─────────────────────────────────────────┘
```

### Venue Analytics Dashboard
```
┌─────────────────────────────────────────┐
│ Venue Analytics                          │
│ [Last 30 days ▼]                        │
│                                         │
│ Attendance by Venue                     │
│ ┌─────────────────────────────────────┐ │
│ │███████████████ Club Madrid  95%    │ │
│ │████████████░░░ Padel Norte  93%    │ │
│ │██████████░░░░░ Centro Oeste  87%   │ │
│ │████████░░░░░░░ Padel Sur    81%    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Average Ratings                         │
│ ┌─────────────────────────────────────┐ │
│ │███████████████ Club Madrid  4.5    │ │
│ │███████████░░░░ Padel Norte  4.2    │ │
│ │██████████░░░░░ Centro Oeste  4.0   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Matches per Venue (Last 6 months)      │
│ [Line chart showing usage trends]       │
│                                         │
│ Venue Performance Table                 │
│ ┌─────────────────────────────────────┐ │
│ │ Venue | Matches | Rating | Att.%  │ │
│ │ Club Madrid | 24 | 4.5 ★ | 95%   │ │
│ │ Padel Norte | 18 | 4.2 ★ | 93%    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Acceptance Criteria

### v1 - Core Venue Management
- [ ] Users can create venue profiles (admin only initially)
- [ ] Venue listing page shows all venues with basic info
- [ ] Venue detail page shows full venue information
- [ ] Users can submit ratings for venues they've played at
- [ ] Ratings require all 6 dimensions to be rated (1-5 stars)
- [ ] Reviews are optional (10-500 characters)
- [ ] Venue cards show aggregate ratings and key attributes

### v1 - Rating System
- [ ] Star slider UI for each rating dimension
- [ ] Overall rating calculated as weighted average
- [ ] Users can edit their ratings anytime
- [ ] Each user can only have one rating per venue
- [ ] Ratings display on venue detail page with breakdown
- [ ] Materialized view `venue_analytics` refreshes automatically

### v1 - Reviews & Voting
- [ ] Reviews display on venue detail page
- [ ] Users can vote reviews as helpful/not helpful
- [ ] Duplicate voting prevented
- [ ] Self-voting prevented
- [ ] Reviews sorted by helpful votes by default

### v1 - Venue Recommendations
- [ ] Event creation shows recommended venues
- [ ] Recommendations include badges (Top rated, Best attendance)
- [ ] Venues can be selected from recommendations

### v1 - Basic Analytics
- [ ] Admin dashboard shows venue analytics
- [ ] Charts display attendance and rating data
- [ ] Venue performance table shows summary stats

### v2 - Match-Venue Linking (stretch)
- [ ] Matches can be linked to venues
- [ ] Venue-based match history displays
- [ ] Analytics include match-venue data

### v2 - Personalized Preferences (stretch)
- [ ] Users can set venue preferences (surface, indoor/outdoor, amenities)
- [ ] Recommendations personalized based on preferences
- [ ] Preference match indicator on venue cards

## Edge Cases
- [ ] Venue deleted: Ratings cascade delete; matches retain venue reference as null or "Unknown venue"
- [ ] User leaves group: Their ratings remain in historical data but excluded from current averages
- [ ] Venue with no ratings: Display "No ratings yet" instead of 0 stars
- [ ] Invalid rating values (out of range): Backend validation required
- [ ] Review text too short/long: Client-side validation + backend check
- [ ] Materialized view refresh fails: Fallback to real-time query with performance warning
- [ ] Duplicate venue creation: Check for similar names/addresses and warn user

## Performance Considerations
- Materialized view `venue_analytics` for efficient analytics queries
- Refresh trigger after rating changes (concurrent refresh to avoid blocking)
- Indexes on venue, rating, and vote tables
- Lazy loading for reviews (load first 10, load more on scroll)
- Cache venue recommendations (5-minute TTL)
- For large groups (50+ venues), pagination on venue listing

## Future Enhancements

- **Cross-group venue sharing**: Discover venues used by other groups
- **Venue booking integration**: Direct booking through venue APIs
- **Photo uploads**: Allow users to upload venue photos
- **Venue owner responses**: Allow venue staff to respond to reviews
- **Venue favorites**: Users can mark venues as favorites
- **Geolocation features**: "Near me" venue finder
- **Social sharing**: Share venue reviews to social media
- **Venue challenge system**: "Play all top-rated venues this month"
- **Seasonal recommendations**: Suggest indoor venues in winter, outdoor in summer
- **Cost tracking**: Track venue booking fees per venue
- **Venue comparisons**: Compare two venues side-by-side

## Design Notes

- **Ratings are subjective**: Allow diverse opinions without policing
- **Constructive feedback only**: Flag abusive reviews (future moderation system)
- **Respect venue privacy**: Don't expose sensitive venue information
- **Encourage honest feedback**: Anonymous ratings available (user choice)
- **Make analytics actionable**: Help admins make decisions based on data
- **Keep it fun**: This is about finding great places to play, not policing venues
- **Balance detail with simplicity**: Power users want full ratings; casual users just want to know "is this good?"
- **Visual feedback**: Use stars, colors, and badges for quick comprehension

## Data Considerations

**Minimum ratings for display**:
- Show aggregate ratings after 3+ reviews (to avoid skew from outliers)
- Show "New venue - be the first to rate!" for venues with 0-2 reviews

**Rating recency**:
- Weight recent reviews more heavily in recommendations (future enhancement)
- Display "Rating based on reviews from last 12 months" badge

**Venue linking**:
- Matches linked to venues retrospectively (backfill historical data)
- Venues can be added after matches were played
- "Unknown venue" placeholder for unlinked matches

**Analytics timeframes**:
- Default to last 30 days for analytics
- Option to view 7 days, 90 days, 1 year, all time

**RLS**:
- All venue data scoped to group (same as other features)
- Ratings visible to all group members
- Analytics dashboard limited to group admins
