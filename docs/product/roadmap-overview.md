# Padelapp Product Roadmap

> Last Updated: February 19, 2026
> Product Owner: Fede
> Product Strategist: Maya

---

## 🎯 Current State

**App Status:** Private (waitlist only, not public)
**User Base:** ~30 users (Fede + friends for testing)
**Focus:** Polish → Attract → Revenue

---

## 📋 Phase 1: Polish & Stabilize (CURRENT)

**Goal:** Fix bugs, improve UX, ensure existing features work flawlessly before expanding access

### Key Priorities

#### 1. Bug Fixes
- [ ] Fix Events Attendee Dropdown — Missing "invites" filter
  - Owner: Jordan (Frontend)
  - Status: Jordan previously fixed (commit cd58ea4) — verify if still broken

#### 2. UX Improvements
- [ ] Fix Duplicate QuickActionsFAB on Dashboard
  - Owner: Jordan (Frontend)
  - Priority: High — confusing UI issue

- [ ] Fix Challenges Page Membership Handling
  - Owner: Jordan (Frontend)
  - Priority: High — 404 for non-members is poor UX

- [ ] Add AppShell to Venues Routes
  - Owner: Chris (Frontend) or Jordan (Frontend)
  - Priority: High — inconsistent navigation

#### 3. Technical Debt
- [ ] Optimize N+1 Query Patterns
  - Owner: Chris (Backend)
  - Details: Individual RPC calls per player/match should be batched

- [ ] Test Coverage Expansion
  - Owner: Taylor (QA)
  - Details: Add E2E tests for critical user journeys

---

## 📋 Phase 2: Public Launch & User Growth (NEXT)

**Goal:** Remove waitlist barrier, make app publicly accessible, grow user base organically

### Public Launch Strategy

**Decision Needed:** Choose one path:
- **Option A:** Open fully to public (no waitlist)
- **Option B:** Waitlist → Email invites → Gradual onboarding

#### User Acquisition Priorities

1. **Public Profile Pages** — Let non-logged users browse rankings, player profiles
2. **Social Sharing** — Make rankings/matches shareable to social media (improves organic reach)
3. **Onboarding Flow** — Smooth join experience (reduce friction)
4. **SEO Optimization** — Improve discoverability for organic traffic

### Success Metrics
- [ ] Remove waitlist barrier
- [ ] Achieve 100+ active users
- [ ] 50% of new joins from organic sources

---

## 📋 Phase 3: Venue Management & Revenue (AFTER GROWTH)

**Goal:** Monetize through venue management and sponsored content

### Venue Management Features

**Decision Needed:** Scope of venue management features

#### Scope Options
- **Option A (Minimal):** Rating + Display only
  - Owners add/manage their venues
  - Users rate existing venues
  - No venue fees or listings

- **Option B (Full):** Complete venue marketplace
  - Venue listings (owners pay for visibility)
  - Venue management CRUD (owners control their venues)
  - Enhanced search and discovery
  - Booking/scheduling capabilities

#### Implementation Notes
- **Owner Perspective:** Venue owners can showcase their clubs, attract players
- **User Value:** Find courts, book slots, view amenities/ratings
- **Revenue:** Venue listing fees (recurring revenue stream)

### Revenue Pipeline

#### 1. Venue Listings (Immediate Revenue)
- Venue owners pay monthly/annual fee to feature their courts
- Pricing: $5-20/month based on visibility tier

#### 2. Sponsored Challenges (Brand Partnerships)
- Brands sponsor tournaments/challenges
- Promotional placements on event pages
- Revenue sharing with venue owners

#### 3. Premium Memberships (Recurring Revenue)
- Enhanced features for paying members:
  - Pro analytics dashboard
  - Priority booking
  - Exclusive discounts
  - Advanced insights

#### 4. Pro Analytics (High-Tier Revenue)
- Deep analytics for clubs/organizers:
  - Attendance trends
  - Revenue tracking
  - Player development analysis
  - Match outcome predictions

### Success Metrics
- [ ] 10+ active venues on platform
- [ ] $X monthly recurring revenue (venue fees + subscriptions)
- [ ] Y sponsored challenges completed

---

## 🎯 Long-Term Vision

**Padelapp is the "Airbnb for padel" — discover courts, find players, play matches**

### Core Value Propositions

1. **For Players:** Find courts, book matches, track ranking, grow as a player
2. **For Venue Owners:** Showcase courts, attract players, manage bookings
3. **For Brands:** Sponsor events, reach engaged players
4. **For Clubs:** Analyze play, manage memberships, grow community

### Future Considerations (Out of Scope for Now)

- **Mobile Apps:** Native iOS/Android apps for on-courts
- **Video Analysis:** AI-powered match video recording and coaching insights
- **League Management:** Full league scheduling, standings, playoffs
- **Equipment Store:** Rackets, balls, accessories integration
- **Community Features:** Chat, forums, local event discovery

---

## 🔄 Development Workflow

### Sprint Planning (Every Monday)
1. Review current phase priorities
2. Select tasks from Trello board
3. Assign to appropriate agents based on phase
4. Update roadmap with progress

### Standup Format
- **Alex (Orchestrator):** Sprint status, blockers, coordination issues
- **Specialists:** Report on their specific area (bugs fixed, features implemented)

---

## 📊 Phase Transition Criteria

### Phase 1 → Phase 2
- [ ] All critical bugs fixed
- [ ] UX improvements deployed
- [ ] Test coverage above 80%
- [ ] Public launch decision made

### Phase 2 → Phase 3
- [ ] User base reaches 100+ active users
- [ ] Public onboarding flow tested
- [ ] Social sharing features live
- [ ] Venue management design complete

---

**Next Steps:**
1. Wait for Fede to clarify Phase 2 public launch strategy (Option A or B)
2. Confirm venue management scope (Option A or B)
3. Prioritize Phase 1 bug fixes
4. Schedule Sprint 3 kickoff once Phase 1 is complete

---

*Last Updated: February 19, 2026 by Claudio 2*
