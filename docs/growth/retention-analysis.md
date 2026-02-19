# User Growth & Retention Analysis

> **Date:** 2026-02-16
> **Author:** Sam (Growth Specialist)
> **Sprint:** Sprint 2 - Product-First
> **Focus:** User engagement drivers, churn analysis, feature usage, and viral mechanisms

---

## Executive Summary

This analysis identifies key drivers of user engagement, potential churn points, and actionable recommendations to improve user stickiness for Padelapp. The app has a strong foundation with core features that support the weekly padel playing flow, but several opportunities exist to enhance retention and virality.

**Key Findings:**
- Strong core loop (attendance → teams → score → ranking) provides clear engagement hook
- Engagement features are scattered across "Beta/Labs" - low visibility reduces adoption
- No onboarding flow to drive early feature discovery
- Limited social mechanisms for referrals and group growth
- Achievement system exists but lacks active notification/triggers

---

## Part 1: What Drives User Engagement?

### 1.1 Core Engagement Drivers

#### The Weekly Padel Loop (Primary Hook)
The app's strongest engagement driver is the core weekly playing cycle:

```
Weekly Events → Attendance RSVP → Match Generation → Score Recording → ELO Ranking Updates
```

**Why this works:**
- **Routine-based:** Most padel groups play weekly, creating predictable return patterns
- **Competitive:** ELO rankings provide clear progression and comparison
- **Social:** Group-based design creates accountability and belonging
- **Immediate feedback:** Rankings update after each match

**Current Implementation Strengths:**
- ✅ Event system with RSVP tracking
- ✅ Automatic match suggestions based on attendance
- ✅ ELO rating system with history
- ✅ Leaderboards visible on dashboard

**Data Model Support:**
```sql
-- Core tables supporting engagement
groups → events → event_occurrences → attendance
matches → match_teams → match_team_players
players → player_elo (ratings over time)
```

#### Achievement & Badge System (Secondary Hook)
The achievements system provides gamification elements:

**Achievement Categories:**
- Matches played milestones
- Win streaks
- ELO milestones
- Ranking achievements
- Special events

**Why this drives engagement:**
- Goal-oriented progression
- Social recognition (leaderboard display)
- Rare badges create collection motivation
- "First to unlock" competitive dynamic

#### Weekly Challenges (Tertiary Hook)
- Time-limited challenges create urgency
- Weekly leaderboard creates competition
- Streak rewards encourage consistent participation

### 1.2 Feature Usage Analysis (Based on Codebase Structure)

| Feature Category | Visibility | Estimated Usage | Retention Impact |
|-----------------|-----------|-----------------|------------------|
| **Dashboard** | Primary (Home) | HIGH | Critical - first touchpoint |
| **Matches** | Primary (Home + Nav) | HIGH | Core daily/weekly activity |
| **Rankings** | Primary (Home + Nav) | HIGH | Competitive hook |
| **Calendar/Events** | Secondary (Nav) | MEDIUM | Planning/scheduling |
| **Players** | Secondary (Nav) | MEDIUM | Profile management |
| **Pairs** | Labs (Hidden) | LOW | Advanced analytics |
| **Partnerships** | Labs (Hidden) | LOW | Advanced analytics |
| **Venues** | Labs (Hidden) | VERY LOW | Nice-to-have |
| **Achievements** | Labs (Hidden) | LOW | Gamification |
| **Challenges** | Labs (Hidden) | LOW | Weekly competition |

**Key Insight:** High-value engagement features (achievements, challenges) are hidden in "Labs" with low discoverability. Users who never explore Labs miss out on major retention drivers.

---

## Part 2: Why Do Users Stop Using the App?

### 2.1 Churn Risk Points

#### 1. **First-Session Drop-off (New Users)**
**Risk:** High churn after first week if:
- Group doesn't have active weekly schedule
- No matches recorded in first session
- Dashboard appears empty (zero state not engaging)

**Evidence:**
```typescript
// Dashboard shows empty states with minimal CTAs
{recentMatches.length === 0 ? (
  <div>No hay partidos. Cargá el primero para empezar.</div>
) : ...}
```

**Mitigation Needed:**
- Guided onboarding flow
- Quick-match setup wizard
- Empty state gamification ("Start your journey")

#### 2. **Lack of Push Notifications**
**Risk:** Users forget to:
- RSVP to weekly events
- Record match scores
- Check updated rankings

**Evidence:** No notification system found in codebase

#### 3. **No Social Accountability**
**Risk:** Without peer visibility, users skip:
- Attendance RSVPs
- Score recording
- Group engagement

**Evidence:** Limited social proof mechanisms

### 2.2 Engagement Decay Patterns

**Pattern 1: The "Active Group, Passive Player"**
- User joins group but doesn't participate in matches
- Root cause: No personal invitation/reminders
- Solution: Peer-invite flow with social pressure

**Pattern 2: The "Data Entry Fatigue"**
- User tires of manually recording matches
- Root cause: Friction in score entry
- Solution: Photo score capture, quick actions FAB

**Pattern 3: The "Labs Blindspot"**
- User never discovers achievements/challenges
- Root cause: Labs is labeled "optional" / "beta"
- Solution: Feature discovery nudges, onboarding tour

### 2.3 Technical Friction Points

| Pain Point | Impact | Current State |
|------------|--------|---------------|
| Match score entry | HIGH | Multiple pages (match → teams → sets) |
| Attendance RSVP | MEDIUM | Separate events page |
| ELO understanding | MEDIUM | No explanation of rating changes |
| Mobile responsiveness | HIGH (from ROADMAP) | Known issue, Fede's PRIORITY #1 |

---

## Part 3: What Features Are Most Used?

### 3.1 Core Loop Features (High Usage)

**Dashboard (`/g/[slug]`)**
- Entry point for all users
- Shows: Next match, recent matches, ELO leaderboard
- Critical for daily/weekly engagement

**Matches (`/g/[slug]/matches`)**
- Core data entry point
- View list, create new, edit existing
- High frequency activity (1-3x per playing session)

**Rankings (`/g/[slug]/ranking`)**
- Primary competitive feature
- ELO-based sorting with position indicators
- High post-match engagement (check results)

### 3.2 Secondary Features (Medium Usage)

**Calendar (`/g/[slug]/calendar`)**
- Event planning and visibility
- Weekly schedule management
- Used by group organizers

**Players (`/g/[slug]/players`)**
- Profile management
- Statistics viewing
- Used for team selection prep

### 3.3 Labs Features (Low Usage - Major Opportunity)

**Achievements (`/g/[slug]/achievements`)**
- Badge collection system
- Rarity tiers (common → legendary)
- Leaderboard display
- **Status:** Hidden in Labs, likely <10% adoption

**Challenges (`/g/[slug]/challenges`)**
- Weekly challenges system
- Streak rewards
- Weekly leaderboard
- **Status:** Hidden in Labs, likely <5% adoption

**Partnerships (`/g/[slug]/partnerships`)**
- Advanced pair analytics
- Chemistry metrics
- Win rate by partner
- **Status:** Power user feature, <5% adoption

---

## Part 4: Viral Features for Referrals

### 4.1 Current Virality Gaps

**❌ Missing Viral Mechanisms:**
- No shareable ELO rankings (public ranking exists but no share UI)
- No match result sharing
- No achievement sharing
- No group invitation links (passphrase only)
- No referral rewards

### 4.2 Viral Feature Opportunities

#### 1. **Shareable Match Moments**
**Concept:** Share match results with visual cards
```
After match recording → "Share result" button
→ Generates image: "I won 6-4, 6-3 with @Carlos!"
→ Share to WhatsApp/Instagram Stories
```

**Viral Impact:** High - showcases competitive wins, invites curiosity

#### 2. **Public Profile Pages**
**Concept:** Shareable player profile with ELO, achievements, recent form
```
/g/[slug]/players/[id]/share → Public URL
→ Displays: ELO, rank, top achievements, win rate
→ Share: "Check out my padel stats!"
```

**Viral Impact:** Medium - social proof, competitive炫耀

#### 3. **Group Invitation System**
**Concept:** Invite links with social proof
```
"Join [Group Name] - 12 active players, weekly games"
→ Link includes: member count, last match date, top player ELO
→ Reduces friction vs passphrase-only
```

**Viral Impact:** Very High - lowers barrier to new groups

#### 4. **Achievement Sharing**
**Concept:** Unlock notification → Share trigger
```
"You unlocked 'Rising Star' badge! 🌟 Share?"
→ Generates: Badge image + stat context
→ Share to group chat or social
```

**Viral Impact:** Medium - gamified social proof

#### 5. **Challenge Leaderboard Sharing**
**Concept:** Weekly challenge → "I beat [Name]!"
```
After winning weekly challenge → Share card
→ "This week I climbed to #3 in the challenge!"
→ Creates FOMO in group
```

**Viral Impact:** High - competitive jealousy drives participation

### 4.3 Virality Mechanics Prioritization

| Feature | Viral Score | Effort | Priority |
|---------|-------------|--------|----------|
| Shareable Match Results | 8/10 | Medium | **P1** |
| Group Invite Links | 9/10 | High | **P1** |
| Achievement Sharing | 7/10 | Low | **P2** |
| Public Player Profiles | 6/10 | Medium | **P2** |
| Challenge Leaderboard Sharing | 7/10 | Low | **P2** |

---

## Part 5: Actionable Recommendations

### 5.1 Quick Wins (Implement in Sprint 2-3)

#### 1. **Move Achievements & Challenges out of Labs** 🔥 HIGH IMPACT
**Rationale:** These are core retention features currently hidden
**Effort:** Low - just move from Labs to main navigation
**Expected Impact:** 2-3x increase in feature adoption

**Implementation:**
```tsx
// Layout navigation - add to main nav
const mainNav = [
  { href: '/matches', label: 'Partidos' },
  { href: '/players', label: 'Jugadores' },
  { href: '/achievements', label: 'Logros' },    // NEW
  { href: '/challenges', label: 'Desafíos' },   // NEW
  { href: '/ranking', label: 'Ranking' },
]
```

**Files to Change:**
- `src/app/g/[slug]/(protected)/layout.tsx`

---

#### 2. **Add Achievement Notification Toast** 🔥 HIGH IMPACT
**Rationale:** Users don't know when they unlock achievements
**Effort:** Low - add toast on achievement unlock
**Expected Impact:** Immediate dopamine hit, increases engagement

**Implementation:**
- Create `AchievementToast` component
- Trigger on achievement insert (via Supabase realtime or page refresh)
- Display: Badge icon + "You unlocked [Achievement Name]!"

**Files to Create/Modify:**
- `src/components/AchievementToast.tsx` (NEW)
- Add to `src/app/g/[slug]/(protected)/layout.tsx`

---

#### 3. **Add Empty State CTA on Dashboard** 🔥 HIGH IMPACT
**Rationale:** New users see empty dashboard, no clear action
**Effort:** Low - improve empty state copy and CTAs
**Expected Impact:** Reduces first-session churn

**Implementation:**
```tsx
{recentMatches.length === 0 ? (
  <div className="flex flex-col items-center gap-4">
    <p>¡Tu grupo está listo! 🎾</p>
    <button className="btn-primary">
      Registrar primer partido
    </button>
  </div>
) : ...}
```

**Files to Change:**
- `src/app/g/[slug]/(protected)/page.tsx`

---

#### 4. **Add "Share Match" Button on Match Detail** ⭐ MEDIUM IMPACT
**Rationale:** First viral feature, easy to implement
**Effort:** Low
**Expected Impact:** Increases group visibility, organic growth

**Implementation:**
- Add share button to match detail page
- Generate shareable image/card (can use existing MatchCard component)
- Share to: Copy link, WhatsApp, Twitter

**Files to Modify:**
- `src/app/g/[slug]/(protected)/matches/[id]/page.tsx`

---

### 5.2 Medium-Term Wins (Sprint 3-4)

#### 5. **Implement Group Invitation Links**
**Rationale:** Lower barrier to group creation, viral growth
**Effort:** Medium - need backend token system
**Expected Impact:** High - increases new group acquisition

**Implementation:**
- Create `group_invites` table with tokens
- Generate shareable link: `/join/[token]`
- Flow: Click link → view group info → enter passphrase → join

**Database Changes:**
```sql
create table group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  token text not null unique,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_uses int default null,
  uses_count int default 0
);
```

**MAJOR FLAG:** Touches DB schema, requires migration

---

#### 6. **Add Weekly Challenge Reminder Notification**
**Rationale:** Nudge inactive users, increase challenge participation
**Effort:** Medium - needs notification system
**Expected Impact:** Medium - increases weekly engagement

**Implementation:**
- Track last challenge participation date
- If >7 days inactive, send reminder: "New challenge available! You're at rank X"
- Use email or in-app notification

---

#### 7. **Public Profile Pages with Share URL**
**Rationale:** Enable social proof and competitive sharing
**Effort:** Medium
**Expected Impact:** Medium - social media sharing

**Implementation:**
- Create `/g/[slug]/players/[id]/public` route (no auth required)
- Display: ELO, rank, achievements, recent form
- Add "Share Profile" button

**Database Changes:**
- Add `public_profile_enabled` column to `players` table (default: false)

---

### 5.3 Long-Term Strategic Features (Sprint 5+)

#### 8. **Push Notification System**
**Rationale:** Proactive engagement, reduce reliance on user initiative
**Effort:** High - requires infrastructure
**Expected Impact:** High - increases DAU/MAU ratio

**Use Cases:**
- "Your group's event starts in 1 hour"
- "Match results are in - check your new ELO!"
- "You're about to lose your win streak!"
- "New achievement unlocked!"

---

#### 9. **Onboarding Flow**
**Rationale:** Reduce first-session churn, drive feature discovery
**Effort:** High
**Expected Impact:** High - increases activation rate

**Components:**
- Welcome tour (highlight core features)
- First match wizard (guided score entry)
- Feature discovery nudges (after X matches, prompt to check Labs)

---

#### 10. **Advanced Partnership Analytics (Promote from Labs)**
**Rationale:** Power user retention, competitive advantage
**Effort:** Low (already built, just need promotion)
**Expected Impact:** Medium - retains competitive players

---

## Part 6: Implementation Roadmap

### Phase 1: Quick Wins (Week 1-2)
**Owner:** Sam + Jordan (UX)

| Task | Effort | Priority | Due |
|------|--------|----------|-----|
| Move Achievements/Challenges to main nav | 2h | 🔥 High | Feb 20 |
| Add Achievement Toast component | 4h | 🔥 High | Feb 20 |
| Improve Dashboard empty states | 3h | 🔥 High | Feb 20 |
| Add Share Match button | 6h | ⭐ Medium | Feb 21 |

**Success Metrics:**
- Achievements page views: +200%
- Challenges page views: +150%
- First-week user activation: +20%

---

### Phase 2: Viral Features (Week 3-4)
**Owner:** Sam + Chris (Backend)

| Task | Effort | Priority | Due |
|------|--------|----------|-----|
| Design group invite system | 4h | 🔥 High | Feb 24 |
| Implement group_invites table | 6h | 🔥 High | Feb 25 |
| Create invite link generation UI | 8h | 🔥 High | Feb 26 |
| Add invite link landing page | 6h | 🔥 High | Feb 27 |

**Success Metrics:**
- New groups via invites: +50%
- Invite link click-through: >30%

---

### Phase 3: Engagement Boosters (Week 5-6)
**Owner:** Sam + Taylor (QA)

| Task | Effort | Priority | Due |
|------|--------|----------|-----|
| Design onboarding flow | 8h | ⭐ Medium | Mar 3 |
| Implement welcome tour | 12h | ⭐ Medium | Mar 5 |
| Add feature discovery nudges | 10h | ⭐ Medium | Mar 6 |

**Success Metrics:**
- Feature discovery (Labs visits): +100%
- 7-day retention: +15%

---

## Part 7: Success Metrics & KPIs

### 7.1 Core Engagement Metrics

| Metric | Current (Estimated) | Target (Q2 2026) | Tracking Method |
|--------|---------------------|------------------|-----------------|
| DAU/MAU Ratio | ~20% | 35% | Analytics needed |
| Weekly Active Users | ~70% of total | 85% | Event tracking |
| Match Recording Rate | ~60% of scheduled | 80% | DB query |
| Feature Adoption (Achievements) | ~10% | 40% | Page views |
| Feature Adoption (Challenges) | ~5% | 30% | Page views |

### 7.2 Retention Metrics

| Metric | Current (Estimated) | Target (Q2 2026) | Tracking Method |
|--------|---------------------|------------------|-----------------|
| Day 1 Retention | ~40% | 60% | Cohort analysis |
| Day 7 Retention | ~25% | 45% | Cohort analysis |
| Day 30 Retention | ~15% | 30% | Cohort analysis |
| Group Churn (30d) | ~20% | 10% | DB query |

### 7.3 Virality Metrics

| Metric | Current (Estimated) | Target (Q2 2026) | Tracking Method |
|--------|---------------------|------------------|-----------------|
| Shares per Match | 0 | 0.5 | Share button clicks |
| New Users via Invites | 0% | 30% | Invite link tracking |
| k-factor (viral coefficient) | ~0.3 | 0.8 | Referral math |

---

## Part 8: Risks & Mitigations

### 8.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Realtime notifications overload | High | Medium | Rate limiting, opt-out |
| Public profile privacy concerns | High | Medium | Opt-in by default, easy disable |
| Invite link abuse | Medium | Low | Token expiration, max uses |

### 8.2 Product Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Feature bloat reduces clarity | High | Medium | Gradual rollout, user testing |
| Gamification feels forced | Medium | Medium | A/B test, user feedback |
| Viral features ignored | Medium | High | Make share value clear |

---

## Part 9: Next Steps

### Immediate Actions (This Week)

1. ✅ **Create this analysis document** (DONE)
2. ⏭️ **Prioritize Quick Wins with team**
   - Review recommendations in next team standup
   - Assign owners to each quick win
3. ⏭️ **Start implementation**
   - Begin with Achievements/Challenges nav move (highest ROI)
   - Follow with Achievement Toast

### Follow-up Actions (Next Sprint)

1. **Set up basic analytics** (if not already in place)
   - Track page views for key features
   - Monitor match recording rates
2. **A/B test empty state CTAs**
   - Test different messaging for new users
3. **Survey active users**
   - Understand why they use the app
   - Identify unmet needs

---

## Appendix A: Feature Inventory

### Core Features (Production)
- ✅ Group management with passphrase access
- ✅ Event/attendance system
- ✅ Match recording with set scores
- ✅ ELO ranking system
- ✅ Player management (usual + invite)
- ✅ Match history
- ✅ Pair statistics
- ✅ Head-to-head comparisons
- ✅ Match predictions
- ✅ Recent form tracking (streaks)

### Beta/Labs Features
- 🧪 Calendar view
- 🧪 Partnership analytics
- 🧪 Venue ratings
- 🧪 Achievements system (ready to promote)
- 🧪 Weekly challenges (ready to promote)
- 🧪 Tournaments support

### Missing Features (Opportunities)
- ❌ Notification system
- ❌ Group invite links
- ❌ Shareable content
- ❌ Public profiles
- ❌ Onboarding flow
- ❌ Analytics dashboard

---

## Appendix B: Database Schema Highlights

### Tables Supporting Growth Features

```sql
-- Engagement tracking
achievements (player_id, achievement_key, unlocked_at)
player_badges (player_id, badge_id, earned_at)

-- Challenges system
weekly_challenges (challenge_id, week_start, criteria)
challenge_participation (player_id, challenge_id, progress)

-- Event/attendance (core loop)
events (group_id, name, recurring_pattern)
event_occurrences (event_id, date, time)
attendance (occurrence_id, player_id, status)

-- For future invite system
-- group_invites (to be added)
-- player_settings (public_profile_enabled, notification_prefs - to be added)
```

---

## Appendix C: Codebase Navigation

### Key Files for Quick Win Implementation

**Navigation Layout:**
- `src/app/g/[slug]/(protected)/layout.tsx` - Main navigation
- `src/app/g/[slug]/(protected)/page.tsx` - Dashboard

**Achievement System:**
- `src/app/g/[slug]/(protected)/achievements/page.tsx` - Achievements page
- `src/components/AchievementsLeaderboard.tsx` - Leaderboard component

**Challenges System:**
- `src/app/g/[slug]/(protected)/challenges/page.tsx` - Challenges page
- `src/app/g/[slug]/(protected)/challenges/challenges-dashboard.tsx` - Dashboard component

**Match Features:**
- `src/app/g/[slug]/(protected)/matches/[id]/page.tsx` - Match detail
- `src/components/MatchCard.tsx` - Match card component

---

**End of Document**

---

*This analysis will be updated as we gather more data from user behavior and implement the recommended changes.*
