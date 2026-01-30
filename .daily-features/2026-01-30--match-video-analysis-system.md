# Feature: Match Video Analysis System

**Status:** PROPOSED

## Summary
A comprehensive video analysis system that allows players to upload, annotate, and discuss recorded match videos. Track specific moments with timestamps, add frame-by-frame drawings, and share insights with group members. Transform recorded matches into actionable coaching moments with collaborative feedback loops.

## Background

Video is the most powerful tool for improving in padel. Watching your own matches reveals:
- Technical flaws (grip, swing mechanics, follow-through)
- Positional errors (court coverage, shot selection)
- Tactical patterns (opponent weaknesses, partner communication)
- Progress over time (compare your serve today vs last month)

**Current gap:** Padelapp tracks scores, stats, and ELO, but has no way to store or analyze match video. Players record matches on phones but have:
- No centralized place to store videos
- No tools to mark key moments
- No way to share specific timestamps with others
- No collaborative feedback mechanisms
- No progress tracking over time

**Why this matters:**
Serious padel players and coaches already film matches. Adding video analysis turns raw footage into structured learning:
- Mark your best serves to study what worked
- Annotate errors to see patterns
- Share timestamped feedback with teammates
- Compare your technique week to week
- Build a library of reference footage

## User Stories

### As a player, I want to:
- Upload match videos and link them to the match in Padelapp
- Mark key moments (errors, great shots, coaching points) with timestamps
- Add drawings and text annotations on specific frames
- Watch the match with all annotations overlayed
- Share specific clips or timestamps with my coach or teammates
- Compare my technique across multiple videos
- See a playlist of all my marked moments across all matches

### As a coach, I want to:
- Review player videos and add coaching annotations
- Create timestamped coaching points with voice or text
- Share side-by-side comparisons (player's technique vs ideal form)
- Track player progress by comparing footage over time
- Build a library of reference clips for the group
- Export annotated clips for players to study offline

### As a group, I want to:
- Store all match videos in one place (linked to match records)
- Share analysis insights with teammates
- Build a collection of "team plays" and tactical examples
- Reference specific moments when discussing strategy

## Core Features

### 1. Video Upload & Management

**Upload Flow:**
- After match completion, offer "Upload video" option on match detail page
- Support formats: MP4, MOV, WebM (max 15 minutes for mobile upload, larger via desktop)
- Auto-detect video duration and generate thumbnail from 30% mark
- Videos stored in Supabase Storage with RLS (group-scoped)
- Link video to match record in database

**Video Listing:**
- Match detail page shows "Videos" section
- Each video card shows:
  - Thumbnail (auto-generated)
  - Upload date
  - Duration
  - Annotation count (e.g., "12 annotations")
  - "Watch" button

**Video Management:**
- Delete video ( cascades to all annotations)
- Replace video (preserves annotations if same duration)
- Download original video
- Share video link (group members only)

### 2. Timestamped Annotations

**Marking Moments:**
- While watching video, press "Mark" to add annotation at current timestamp
- Annotation types:
  - 🟢 **Good shot** - Successful play worth studying
  - 🔴 **Error** - Mistake to analyze and correct
  - 🟡 **Coaching point** - General insight or tip
  - 🔵 **Tactical note** - Strategic observation
- Each annotation includes:
  - Timestamp (auto-captured)
  - Type (color-coded badge)
  - Title (optional, default: "Annotation #N")
  - Description (optional text)
  - Drawing (optional, see next section)
  - Created by (player name)
  - Created at (date)

**Annotation Timeline:**
- Video player shows timeline with colored markers for each annotation
- Click marker to jump to that moment
- Hover to see preview (annotation title + time)
- Filter annotations by type (show only errors, only good shots, etc.)

**Annotation List:**
- Below video player, scrollable list of all annotations
- Each shows:
  - Timestamp (clickable)
  - Type badge
  - Title + description
  - Creator avatar
  - Drawing thumbnail (if exists)
  - Edit/delete buttons (for owner)
- Sort by: Time, Type, Creator

### 3. Frame-by-Frame Drawings

**Drawing Tools:**
- Pause video at any frame to start drawing
- Drawing tools:
  - ✏️ Freehand pen (color picker + size slider)
  - ⭕ Circle tool (highlight court areas, players)
  - 🔲 Rectangle tool (draw boxes around elements)
  - ➖ Arrow tool (indicate movement, direction)
  - 📝 Text tool (add labels on the frame)
  - 🎨 Color palette (red, yellow, green, blue, white, black)
- Drawings are saved as JSON overlay on the specific timestamp

**Drawing Display:**
- When playing video, drawings auto-show/hide based on timestamp
- Toggle drawings on/off in video controls
- Drawings render as SVG overlay on video player
- Each drawing has a visible timestamp when hovering

**Drawing Collaboration:**
- Multiple users can add drawings to the same timestamp
- Each drawing shows creator avatar
- Drawings can be edited/deleted by owner
- Drawing history preserved (undo/redo within session)

### 4. Collaborative Feedback

**Comments on Annotations:**
- Any group member can comment on annotations
- Comments support text only (no drawings on comments)
- Threaded replies (unlimited depth)
- @mentions (notify specific players)
- Comment badges show unread count

**Coaching Feedback Mode:**
- Coaches can add "Voice note" to annotations (record 15-60 second audio)
- Audio stored as audio blob, playable on annotation
- Visual indicator shows which annotations have voice notes
- Group role "Coach" has special privileges (see Roles section)

**Feedback Requests:**
- Player can mark annotation as "Request feedback"
- Sends notification to coaches or specific teammates
- Shows "🔔 Feedback requested" badge on annotation

### 5. Side-by-Side Comparison

**Comparison Mode:**
- Select two videos (or two timestamps from same video)
- Display side-by-side with synchronized playback
- Controls:
  - Sync playback (both videos play at same speed)
  - Loop selected section
  - Slow motion (0.5x, 0.25x)
  - Frame-by-frame stepping
- Use cases:
  - Compare today's serve vs last month's
  - Compare player's technique vs reference video
  - Show before/after correction

**Reference Library:**
- Group can upload "reference videos" (pro players, ideal form)
- Reference videos are not linked to matches
- Stored in separate folder: `/videos/references/`
- Can be used in comparisons but not in regular match viewing

**Comparison Annotations:**
- Add comparison notes between two videos
- Mark differences with drawing tools
- Export comparison as split-screen clip (future enhancement)

### 6. Progress Tracking & Playlists

**Player Progress Dashboard:**
- `/g/[slug]/players/[player-id]/video-analysis`
- Shows:
  - Total videos uploaded
  - Total annotations across all videos
  - Annotation breakdown by type (chart)
  - Recent uploads with thumbnail grid
  - "Compare progress" tool: select two dates, see side-by-side

**Annotation Playlist:**
- "My Annotations" page: all annotations created by user
- Filter by type, date range, match
- Click annotation to jump to video at timestamp
- Export playlist as list with timestamps (PDF/CSV)

**Trend Analysis:**
- Track annotation types over time
- Visualize error reduction (e.g., "Unforced errors: 15/match → 5/match")
- Highlight technique improvements (coach can mark "Corrected" on error annotations)

### 7. Video Player Features

**Enhanced Player Controls:**
- Play/pause, scrub, fullscreen
- Speed controls: 0.25x, 0.5x, 0.75x, 1x, 1.5x, 2x
- Frame-by-frame (prev/next frame buttons)
- Loop region (set in/out points)
- Zoom in on specific area (pinch to zoom on mobile)
- Screenshot (capture current frame as image)

**Keyboard Shortcuts:**
- Space: Play/pause
- ←/→: Back/forward 5 seconds
- ↑/↓: Back/forward 1 frame
- M: Toggle drawings
- N: Add annotation at current time
- 1-4: Jump to annotation #N

**Mobile Experience:**
- Touch-friendly controls
- Landscape mode support
- Video downloads to device for offline viewing
- Optimized streaming (adaptive bitrate based on connection)

### 8. Sharing & Export

**Share Clip:**
- Select start/end timestamps to create clip
- Share link includes only that time range
- Clip retains all annotations in range
- Share via WhatsApp, Telegram, or copy link

**Export Annotations:**
- Export all annotations as PDF with screenshots
- Export as CSV (timestamp, type, description, creator)
- Include drawing screenshots in export

**Social Sharing:**
- Share annotated frame to Instagram/WhatsApp
- Frame captures drawing overlay + annotation text
- Auto-generate caption with match context

## Data Model Changes

```sql
-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES players(id),
  title VARCHAR(255),
  storage_path VARCHAR(500) NOT NULL, -- Supabase Storage path
  thumbnail_path VARCHAR(500), -- Auto-generated thumbnail
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, match_id, storage_path)
);

-- Indexes
CREATE INDEX idx_videos_group ON videos(group_id);
CREATE INDEX idx_videos_match ON videos(match_id);
CREATE INDEX idx_videos_uploaded_by ON videos(uploaded_by);

-- Video annotations
CREATE TABLE video_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES players(id),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  timestamp_seconds NUMERIC(10,2) NOT NULL CHECK (timestamp_seconds >= 0),
  annotation_type VARCHAR(50) NOT NULL, -- 'good_shot', 'error', 'coaching_point', 'tactical_note'
  title VARCHAR(255),
  description TEXT,
  drawing_data JSONB, -- SVG overlay data
  feedback_requested BOOLEAN NOT NULL DEFAULT FALSE,
  has_voice_note BOOLEAN NOT NULL DEFAULT FALSE,
  voice_note_path VARCHAR(500), -- Supabase Storage path for audio
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_video_annotations_video ON video_annotations(video_id);
CREATE INDEX idx_video_annotations_created_by ON video_annotations(created_by);
CREATE INDEX idx_video_annotations_group ON video_annotations(group_id);
CREATE INDEX idx_video_annotations_type ON video_annotations(annotation_type);
CREATE INDEX idx_video_annotations_timestamp ON video_annotations(timestamp_seconds);

-- Annotation comments
CREATE TABLE video_annotation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES video_annotations(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES video_annotation_comments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (LENGTH(comment_text) BETWEEN 1 AND 2000),
  mentioned_players UUID[], -- Array of player IDs who were @mentioned
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_annotation_comments_annotation ON video_annotation_comments(annotation_id);
CREATE INDEX idx_annotation_comments_player ON video_annotation_comments(player_id);

-- Reference videos (not linked to matches)
CREATE TABLE reference_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES players(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., 'technique', 'tactics', 'pro_example'
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reference_videos_group ON reference_videos(group_id);
CREATE INDEX idx_reference_videos_category ON reference_videos(category);

-- Video comparisons (saved side-by-side comparisons)
CREATE TABLE video_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES players(id),
  title VARCHAR(255),
  video_a_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  video_a_timestamp NUMERIC(10,2),
  video_b_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  reference_video_id UUID REFERENCES reference_videos(id) ON DELETE CASCADE,
  reference_timestamp NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (video_a_id IS NOT NULL AND video_b_id IS NOT NULL) OR
    (video_a_id IS NOT NULL AND reference_video_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_video_comparisons_group ON video_comparisons(group_id);
CREATE INDEX idx_video_comparisons_created_by ON video_comparisons(created_by);

-- Player roles (for coaches)
ALTER TABLE group_members ADD COLUMN role VARCHAR(50) DEFAULT 'player';
-- Values: 'player', 'coach', 'admin'
```

## API Endpoints

### Videos

```typescript
// POST /api/videos - Upload video
POST /api/videos
Body: FormData {
  matchId: string,
  video: File,
  title?: string
}

Response: {
  id: string,
  storagePath: string,
  thumbnailPath: string,
  duration: number,
  // ... other video fields
}

// GET /api/videos/match/:matchId - List videos for a match
GET /api/videos/match/:matchId

Response: Video[]

// GET /api/videos/:id - Get video details
GET /api/videos/:id

Response: {
  video: Video,
  annotations: VideoAnnotation[],
  annotationsCount: number
}

// DELETE /api/videos/:id - Delete video
DELETE /api/videos/:id

Response: { success: true }

// GET /api/videos/:id/stream - Stream video
GET /api/videos/:id/stream

Response: Video stream (Supabase Storage)
```

### Annotations

```typescript
// GET /api/videos/:videoId/annotations - Get all annotations
GET /api/videos/:videoId/annotations?filterBy=type

Response: VideoAnnotation[]

// POST /api/videos/:videoId/annotations - Create annotation
POST /api/videos/:videoId/annotations
Body: {
  timestampSeconds: number,
  annotationType: 'good_shot' | 'error' | 'coaching_point' | 'tactical_note',
  title?: string,
  description?: string,
  drawingData?: DrawingData,
  feedbackRequested?: boolean
}

Response: VideoAnnotation

// PUT /api/videos/:videoId/annotations/:id - Update annotation
PUT /api/videos/:videoId/annotations/:id
Body: Partial<AnnotationFields>

Response: VideoAnnotation

// DELETE /api/videos/:videoId/annotations/:id - Delete annotation
DELETE /api/videos/:videoId/annotations/:id

Response: { success: true }

// POST /api/annotations/:id/voice-note - Upload voice note
POST /api/annotations/:id/voice-note
Body: FormData {
  audio: File
}

Response: { success: true, voiceNotePath: string }

// GET /api/annotations/:id/voice-note - Stream voice note
GET /api/annotations/:id/voice-note

Response: Audio stream
```

### Comments

```typescript
// GET /api/annotations/:annotationId/comments - Get comments
GET /api/annotations/:annotationId/comments

Response: VideoAnnotationComment[]

// POST /api/annotations/:annotationId/comments - Add comment
POST /api/annotations/:annotationId/comments
Body: {
  commentText: string,
  parentCommentId?: string
}

Response: VideoAnnotationComment

// DELETE /api/comments/:commentId - Delete comment
DELETE /api/comments/:commentId

Response: { success: true }
```

### Reference Videos

```typescript
// GET /api/reference-videos - List reference videos
GET /api/reference-videos?category=technique

Response: ReferenceVideo[]

// POST /api/reference-videos - Upload reference video
POST /api/reference-videos
Body: FormData {
  title: string,
  description?: string,
  category?: string,
  video: File
}

Response: ReferenceVideo

// DELETE /api/reference-videos/:id - Delete reference video
DELETE /api/reference-videos/:id

Response: { success: true }
```

### Comparisons

```typescript
// GET /api/comparisons - List saved comparisons
GET /api/comparisons

Response: VideoComparison[]

// POST /api/comparisons - Save comparison
POST /api/comparisons
Body: {
  title?: string,
  videoAId?: string,
  videoATimestamp?: number,
  videoBId?: string,
  referenceVideoId?: string,
  referenceTimestamp?: number,
  notes?: string
}

Response: VideoComparison

// GET /api/comparisons/:id - Get comparison details
GET /api/comparisons/:id

Response: VideoComparison with video URLs

// DELETE /api/comparisons/:id - Delete comparison
DELETE /api/comparisons/:id

Response: { success: true }
```

### Analytics

```typescript
// GET /api/video-analytics/player/:playerId - Get player stats
GET /api/video-analytics/player/:playerId

Response: {
  totalVideos: number,
  totalAnnotations: number,
  annotationsByType: {
    good_shot: number,
    error: number,
    coaching_point: number,
    tactical_note: number
  },
  recentVideos: Video[],
  errorTrend: Array<{date: string, count: number}>
}

// GET /api/video-analytics/group/:groupId - Get group stats
GET /api/video-analytics/group/:groupId

Response: {
  totalVideos: number,
  totalAnnotations: number,
  mostAnnotatedPlayers: Array<{playerId: string, count: number}>,
  topCoaches: Array<{playerId: string, annotations: number}>
}
```

## Frontend Components

### `VideoUploader`
Modal for uploading video:
- File drop zone with drag-and-drop
- File validation (format, max size)
- Progress bar during upload
- Thumbnail preview after upload
- Title field (optional)
- "Upload" button with loading state

### `VideoPlayer`
Enhanced video player component:
- HTML5 video player with custom controls
- Timeline with annotation markers (clickable)
- Drawing overlay (SVG on top of video)
- Playback speed controls
- Frame-by-frame buttons
- Drawing toolbar (show/hide)
- Keyboard shortcut hints
- Fullscreen mode
- Screenshot button

### `AnnotationList`
Scrollable list below video player:
- Each annotation shows:
  - Timestamp (clickable)
  - Type badge (color-coded)
  - Title + description
  - Creator avatar + name
  - Drawing thumbnail (if exists)
  - Comment count
  - Edit/Delete buttons (owner)
- Filter by type dropdown
- Sort by time/type/creator
- Infinite scroll for large annotation lists

### `AnnotationEditor`
Modal for creating/editing annotations:
- Video preview with current timestamp
- Annotation type selector (radio buttons with icons)
- Title field (optional)
- Description textarea
- Drawing canvas (auto-saved as JSON)
- "Feedback requested" checkbox
- "Request feedback from" dropdown (specific players or all coaches)
- Submit/Cancel buttons

### `DrawingToolbar`
Floating toolbar on video player:
- Tools: Pen, Circle, Rectangle, Arrow, Text
- Color picker (preset colors)
- Line width slider
- Undo/Redo buttons
- Clear button
- Save button (saves to annotation)
- Hide/Show toggle

### `VideoAnnotationCard`
Display card for annotation in list:
- Type badge with icon
- Timestamp (clickable to jump)
- Title (bold)
- Description (truncated if long)
- Creator name + avatar
- Drawing preview thumbnail
- "X comments" badge
- Edit/Delete actions (owner)
- Comment section (expandable)

### `CommentThread`
Threaded comments for annotation:
- Comment input with @mention support
- List of comments (threaded)
- Each comment:
  - Player avatar + name
  - Timestamp
  - Comment text
  - Reply button
  - Delete button (owner)
- "Show X replies" button for collapsed threads

### `SideBySideComparison`
Side-by-side video comparison view:
- Two video players synchronized
- Sync checkbox (toggle synchronized playback)
- Loop region controls (set in/out for both videos)
- Speed controls (shared)
- Frame-by-frame stepping (shared)
- Drawing tools (shared overlay)
- Comparison notes section
- Save comparison button

### `ReferenceLibrary`
Page for managing reference videos:
- Upload reference video button
- Grid of reference video cards:
  - Thumbnail
  - Title + description
  - Category badge
  - Duration
  - "Watch" button
  - "Use in comparison" button
- Filter by category
- Delete button (owner or admin)

### `PlayerVideoDashboard`
Player progress dashboard:
- Stats cards:
  - Total videos
  - Total annotations
  - Annotations by type (pie chart)
  - Error trend (line chart)
- Recent videos grid (thumbnails)
- "Compare progress" tool:
  - Date range picker
  - Select two dates
  - Show side-by-side comparison
- "My annotations" link

### `VideoCard`
Compact card for video listing:
- Thumbnail
- Title (or match info)
- Upload date
- Duration
- Annotation count badge
- "Watch" button
- "Share" button

## UI/UX Design

### Video Player Layout
```
┌─────────────────────────────────────────┐
│ Video Player (16:9 aspect ratio)        │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │        [Video Content]              │ │
│ │                                     │ │
│ │    [Drawing Overlay - SVG]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Timeline:                               │
│ ┌─────────────────────────────────────┐ │
│ │██░░🟢░░🔴░░🟡░░🔵░░░░░░░░░░░░░░░│ │
│ │ 12:34    [Scrubber]             15:00│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Controls:                               │
│ [◀◀] [▶] [▶▶] 12:34 / 15:00  [⏯1x] [🎨] [📷] [⛶]│
│ └─────────────────────────────────────┘ │
│                                         │
│ Annotations List:                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 12:34 🔴 Unforced error - forehand miss  │
│ Alice • 2 comments                     │
│ [Drawing preview]                       │
│                                         │
│ 10:22 🟢 Great serve down the T         │
│ Alice • 1 comment                      │
│                                         │
│ 08:15 🟡 Coaching: Watch your footwork  │
│ Coach Bob • 🔔 Feedback requested      │
│ [🎤 Voice note]                         │
└─────────────────────────────────────────┘
```

### Annotation Editor Modal
```
┌─────────────────────────────────────────┐
│ Add Annotation                          │
│ ┌─────────────────────────────────────┐ │
│ │ [Video preview - current frame]    │ │
│ │ Timestamp: 12:34                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Type:                                   │
│ ○ 🟢 Good shot                          │
│ ● 🔴 Error                              │
│ ○ 🟡 Coaching point                     │
│ ○ 🔵 Tactical note                      │
│                                         │
│ Title: [My annotation #12]             │
│ Description:                            │
│ ┌─────────────────────────────────────┐ │
│ │ [Detailed description...]          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Drawing: [Add drawing] [Clear]          │
│ [Drawing canvas preview]               │
│                                         │
│ ☐ Request feedback from:               │
│ [Coach Bob ▼]                          │
│                                         │
│ [Cancel] [Save Annotation]              │
└─────────────────────────────────────────┘
```

### Side-by-Side Comparison
```
┌─────────────────────────────────────────┐
│ Side-by-Side Comparison                  │
│                                         │
│ ┌─────────────────┐ ┌─────────────────┐│
│ │ Video A (Left)  │ │ Video B (Right) ││
│ │ [Frame]         │ │ [Frame]         ││
│ │                 │ │                 ││
│ │ Timestamp: 5:23 │ │ Timestamp: 4:12 ││
│ └─────────────────┘ └─────────────────┘│
│                                         │
│ Controls:                               │
│ [▶] [◀◀] [▶▶] [⏯1x] [🎨]             │
│ ☑️ Sync playback                        │
│ ☑️ Loop region (0:00-0:30)              │
│                                         │
│ Comparison Notes:                       │
│ ┌─────────────────────────────────────┐ │
│ │ Compare elbow position - Video B   │ │
│ │ is better. Notice how the wrist... │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Save Comparison]                       │
└─────────────────────────────────────────┘
```

### Player Video Dashboard
```
┌─────────────────────────────────────────┐
│ Alice's Video Analysis                   │
│                                         │
│ Stats                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 📹 12 videos uploaded                   │
│ 📍 156 annotations created              │
│                                         │
│ Annotations by Type                     │
│ ┌─────────────────────────────────────┐ │
│ │ 🔴 Errors: 45 (29%)                 │ │
│ │ 🟢 Good shots: 78 (50%)             │ │
│ │ 🟡 Coaching points: 20 (13%)         │ │
│ │ 🔵 Tactical notes: 13 (8%)          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Error Trend (Last 30 days)              │
│ [Line chart showing error reduction]    │
│                                         │
│ Recent Videos                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│ │🎬│ │🎬│ │🎬│ │🎬│ ...               │
│ └───┘ └───┘ └───┘ └───┘               │
│ Jan 30 Jan 28 Jan 25 Jan 22            │
│                                         │
│ Compare Progress                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [From: Jan 1 ▼] [To: Jan 30 ▼]         │
│ [Compare]                              │
└─────────────────────────────────────────┘
```

## Acceptance Criteria

### v1 - Core Video Management
- [ ] Players can upload videos linked to matches
- [ ] Video duration auto-detected and thumbnail generated
- [ ] Video player supports playback, seeking, and fullscreen
- [ ] Videos stored in Supabase Storage with RLS
- [ ] Videos listed on match detail page
- [ ] Videos can be deleted by uploader or admin

### v1 - Timestamped Annotations
- [ ] Players can add annotations at any timestamp
- [ ] Annotation types: Good shot, Error, Coaching point, Tactical note
- [ ] Annotations show title, description, type, and creator
- [ ] Video timeline shows annotation markers
- [ ] Clicking marker jumps video to that timestamp
- [ ] Annotation list displays all annotations below player
- [ ] Annotations can be edited/deleted by owner

### v1 - Drawing Tools
- [ ] Drawing toolbar with pen, circle, rectangle, arrow, text tools
- [ ] Color picker with preset colors
- [ ] Drawings saved as JSON overlay on specific timestamp
- [ ] Drawings auto-show/hide based on playback position
- [ ] Drawings can be toggled on/off
- [ ] Drawings render as SVG overlay on video

### v1 - Collaborative Comments
- [ ] Group members can comment on annotations
- [ ] Comments support text (no drawings)
- [ ] Threaded replies supported
- [ ] @mentions notify specific players
- [ ] Comments show unread count

### v1 - Video Player Enhancements
- [ ] Playback speed controls (0.25x to 2x)
- [ ] Frame-by-frame stepping (prev/next frame)
- [ ] Loop region (set in/out points)
- [ ] Screenshot capture
- [ ] Keyboard shortcuts (Space, arrows, M, N)

### v1 - Reference Videos (Basic)
- [ ] Group members can upload reference videos
- [ ] Reference videos have category, title, description
- [ ] Reference videos listed in library page
- [ ] Reference videos can be used in comparisons

### v1 - Side-by-Side Comparison
- [ ] Select two videos (match or reference) for comparison
- [ ] Videos display side-by-side with synchronized playback
- [ ] Comparison notes can be saved
- [ ] Comparisons saved in database
- [ ] Playback speed and looping supported

### v1 - Player Analytics
- [ ] Player dashboard shows total videos and annotations
- [ ] Annotations breakdown by type (chart)
- [ ] Recent videos grid with thumbnails
- [ ] Compare progress tool (select two dates)

### v2 - Voice Notes (Stretch)
- [ ] Coaches can record 15-60 second voice notes on annotations
- [ ] Voice notes play inline with annotation
- [ ] Voice notes stored in Supabase Storage
- [ ] Visual indicator shows annotations with voice notes

### v2 - Feedback Requests (Stretch)
- [ ] Players can mark annotations as "Request feedback"
- [ ] Notifications sent to specified coaches
- [ ] "Feedback requested" badge on annotation
- [ ] Feedback request history tracked

### v2 - Export & Sharing (Stretch)
- [ ] Share specific timestamp as clip (link)
- [ ] Export annotations as PDF with screenshots
- [ ] Export annotations as CSV
- [ ] Share annotated frame to social media

## Edge Cases
- [ ] Video upload fails: Show error message, allow retry
- [ ] Video exceeds max size: Client-side validation, suggest compression
- [ ] Video format not supported: List supported formats
- [ ] Slow internet: Show upload progress, allow retry
- [ ] Thumbnail generation fails: Use default placeholder
- [ ] Drawing exceeds frame size: Clip drawing to video bounds
- [ ] Annotation at invalid timestamp: Backend validation
- [ ] User deletes account: Their videos and annotations preserved (or deleted per policy)
- [ ] Group deleted: Cascade delete all videos and annotations
- [ ] Comparison with videos of different durations: Handle gracefully, allow looping shorter video

## Performance Considerations

- **Video streaming**: Use Supabase Storage with range requests for progressive streaming
- **Thumbnail generation**: Server-side processing after upload (async job)
- **Large annotation lists**: Pagination or infinite scroll
- **Drawing rendering**: SVG overlay for performance, canvas for editing
- **Video compression**: Auto-compress large videos (>500MB) on upload (optional)
- **Bandwidth**: Adaptive streaming based on connection quality (future)
- **Cache video URLs**: Use signed URLs with 1-hour expiry

**Storage limits:**
- Per video: 15 minutes max (mobile), 60 minutes max (desktop)
- Per group: 10GB total storage (configurable)
- Reference videos: Separate quota

## Security & Privacy

- **RLS enforcement**: All video and annotation data group-scoped
- **Signed URLs**: Video URLs expire after 1 hour to prevent unauthorized sharing
- **Content moderation**: Flag inappropriate content (future)
- **Coach role**: Only "coach" role can add voice notes and mark feedback complete
- **Delete permissions**: Only video owner, coach, or admin can delete

## Future Enhancements

- **AI-powered analysis**: Automatic shot classification and error detection
- **Automatic highlight clips**: AI detects exciting moments and creates clips
- **Multi-angle support**: Upload multiple camera angles for same match
- **Telestration mode**: Real-time drawing during playback (like TV sports analysis)
- **Integration with wearables**: Sync with Apple Watch for stats overlay
- **3D trajectory tracking**: Analyze ball movement patterns
- **Coach dashboard**: Aggregate view of all players' progress
- **Video challenges**: "Share your best serve" group challenges
- **Live annotation during matches**: Real-time annotation while match is being played
- **Comparison with pro players**: Match player technique against reference pro footage
- **Progress reports**: Auto-generate monthly progress reports with video snippets

## Design Notes

- **Focus on learning**: Video analysis is about improvement, not judgment
- **Encourage feedback**: Make it easy for coaches to give feedback
- **Keep it collaborative**: Annotations and comments should feel like a conversation
- **Mobile-first**: Most players record on phones, optimize mobile experience
- **Minimal friction**: Upload should be simple, annotations should be quick
- **Progress visible**: Show players how they're improving over time
- **Fun factor**: Gamify annotations (badges, streaks, goals)
- **Privacy first**: Videos are group-scoped and require authentication to view

## Storage Costs

**Estimates for 10GB storage limit:**
- 15-minute video (1080p, moderate quality): ~200MB
- Voice note (30 seconds, compressed): ~500KB
- Thumbnail: ~50KB
- Drawing data (JSON): ~5KB

**Expected usage per group (20 players, weekly matches):**
- 4 matches/week × 200MB = 800MB/week
- ~3.2GB/month
- ~38GB/year

**Recommendation:** Start with 10GB limit, monitor usage, adjust based on plan tier.

## Implementation Phases

### Phase 1 (MVP)
- Video upload + storage
- Basic video player
- Timestamped annotations
- Drawing tools (basic)
- Annotation list

### Phase 2
- Collaborative comments
- Reference videos
- Side-by-side comparison
- Player analytics dashboard

### Phase 3
- Voice notes
- Feedback requests
- Export & sharing
- Coach role enhancements

### Phase 4 (Future)
- AI-powered analysis
- Automatic highlight clips
- Multi-angle support
- Wearable integration
