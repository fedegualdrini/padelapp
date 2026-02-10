# Feature: Match Comments and Discussion

**Status:** PROPOSED

## Why
Matches are social events, and players often want to discuss what happened — great plays, close sets, funny moments, or just congratulate the winners. Currently, the app only tracks stats and scores, but doesn't capture the conversation and community aspect of padel.

Adding match comments would:
1. **Increase engagement** - Players can interact with match history beyond just viewing stats
2. **Preserve memories** - Remembering funny moments or great plays weeks later
3. **Build community** - Discussion fosters a sense of community and friendly competition
4. **Valuable context** - Comments add context to stats (e.g., "We would have won but X twisted their ankle")

Most sports apps (Strava, Tennis Tracker, etc.) have this feature because it keeps users coming back.

## Scope
Add a comment system to matches:
- Comments displayed on match detail pages
- Support for text comments with timestamps
- @mentions to tag other players in comments
- Emoji reactions on comments
- Real-time or near-real-time updates
- Notification system for mentions

### Proposed UX
- **Match Detail Page** (`/g/[slug]/matches/[id]`):
  - Add "Comentarios" section below match stats and team information
  - Shows comments in chronological order (newest at bottom)
  - Each comment shows:
    - Author name and avatar (initials)
    - Comment text
    - Timestamp (relative: "hace 5 minutos")
    - Reaction buttons (👍, 😂, 🔥, 🎉)
    - Reaction counts
  - Input field at bottom for adding new comment
  - @mention autocomplete when typing @
- **Comment Input**:
  - Textarea with placeholder "Escribe un comentario..."
  - Character limit (280 characters, like Twitter)
  - @mention suggestions dropdown shows matching player names
  - Submit button disabled when empty
- **Reactions**:
  - Click emoji to add/remove your reaction
  - Hover to see who reacted
  - Show reaction counts
- **Notifications**:
  - When mentioned (@username), show notification in activity feed
  - Notification links to comment
  - "Comment on your match" notification (optional, might be noisy)

### Sample Comments
- "¡Qué partido! Casi ganamos el tercer set 7-5 🔥"
- "¡Buenísimo jugada @Juan en el segundo set! 🎉"
- "Qué pena que @Carlos no pudo venir, se la perdió una buena"
- "¡MVP bien merecido @María! 5 sets de locura"

## Acceptance Criteria
- [ ] Match detail page shows "Comentarios" section
- [ ] Comments are displayed in chronological order
- [ ] Each comment shows author name, text, and timestamp
- [ ] New comments can be added via input field
- [ ] @mention autocomplete works when typing @
- [ ] Mentioned players are highlighted in comments
- [ ] Emoji reactions can be added/removed from comments
- [ ] Reaction counts are displayed correctly
- [ ] Empty state shows "No hay comentarios aún. ¡Sé el primero!"
- [ ] Comments persist and load correctly on page refresh
- [ ] Timestamps update in real-time (e.g., "hace 5 minutos" → "hace 1 hora")
- [ ] Mobile-responsive layout (comments readable on small screens)
- [ ] Character limit enforced (280 chars)
- [ ] XSS protection (user content is sanitized)
- [ ] Mentions generate notifications (visible in activity feed)
- [ ] Must pass: `npm test`

## Data Requirements
- New table: `match_comments`
  ```sql
  create table match_comments (
    id uuid primary key default gen_random_uuid(),
    match_id uuid not null references matches(id) on delete cascade,
    player_id uuid not null references players(id) on delete cascade,
    content text not null check (length(content) > 0 and length(content) <= 280),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(id) -- single index for lookups
  );

  create index idx_match_comments_match_id on match_comments(match_id, created_at desc);
  ```

- New table: `comment_reactions`
  ```sql
  create table comment_reactions (
    id uuid primary key default gen_random_uuid(),
    comment_id uuid not null references match_comments(id) on delete cascade,
    player_id uuid not null references players(id) on delete cascade,
    emoji text not null, -- e.g., "👍", "😂", "🔥", "🎉"
    created_at timestamptz not null default now(),
    unique(comment_id, player_id) -- one reaction per player per comment
  );

  create index idx_comment_reactions_comment_id on comment_reactions(comment_id);
  ```

- New table: `comment_mentions` (optional, for faster mention queries)
  ```sql
  create table comment_mentions (
    comment_id uuid not null references match_comments(id) on delete cascade,
    mentioned_player_id uuid not null references players(id) on delete cascade,
    primary key (comment_id, mentioned_player_id)
  );
  ```

- New queries:
  - `getMatchComments(matchId, limit?)` - returns comments with author info
  - `getCommentReactions(commentId)` - returns reactions with reactor names
  - `addComment(matchId, playerId, content, mentions[])` - creates comment and mentions
  - `addReaction(commentId, playerId, emoji)` - adds reaction
  - `removeReaction(commentId, playerId)` - removes player's reaction
  - `getMentionedPlayers(commentContent, groupId)` - returns matching players for autocomplete

## Technical Notes
- Use real-time subscriptions via Supabase Realtime for instant comment updates
- Sanitize HTML to prevent XSS attacks (use DOMPurify or similar)
- For @mentions, parse content on save to extract mentions and store in `comment_mentions`
- Mention notification: insert into `audit_log` when comment is created with mentions
- For reaction counts, aggregate from `comment_reactions` on the fly (small dataset)
- Consider soft-deleting comments instead of hard-deleting (for moderation history)

## Test Impact
- Add unit tests for comment CRUD:
  - Create comment with valid data
  - Create comment with empty content fails
  - Create comment exceeding 280 chars fails
  - Update comment (if editable)
  - Delete comment removes associated reactions
- Add unit tests for mentions:
  - Mention parsing extracts player names correctly
  - Mentioned players receive notification
  - Mention autocomplete filters correctly
- Add unit tests for reactions:
  - Add reaction
  - Remove reaction
  - One reaction per player per comment enforced
  - Reaction count aggregation
- Add E2E test for:
  - Viewing comments on match page
  - Adding a new comment
  - Reacting to a comment
  - @mention autocomplete
  - Mention notification appears in activity feed
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Consider allowing comment editing for 5 minutes after creation (like WhatsApp)
- Consider allowing comment deletion by author or group admin
- Future: Add image/photo uploads to comments
- Future: Add thread replies to comments
- Future: Add "pinned comments" for important announcements
- For large groups with lots of comments, consider pagination (load 20 at a time)
- Emoji reactions should be customizable (group admin can change available emojis)
- Mobile: Ensure keyboard doesn't hide the input field
- Accessibility: Ensure comments are screen-reader friendly (announce new comments via ARIA)
- Performance: Batch queries for comments + reactions in single request
