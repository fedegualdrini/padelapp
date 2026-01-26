# Phase 02: Public ranking share URL (token-based)

## Goal
Create a shareable, no-login ranking URL that renders ONLY the ranking chart/table.

URL shape:
- `/g/<slug>/ranking/share/<token>`

Constraints:
- No login/session required.
- Token must be validated.
- Data (ELO timeline + names) must match the protected ranking view (elo_ratings joined to matches filtered by group).
- Use Supabase anon client + SECURITY DEFINER RPC to bypass RLS safely.

Deliverables:
- DB migration: store `groups.ranking_share_token` and create RPC `get_public_ranking_timeline(slug, token)`
- Next.js route: renders TradingViewRankingLayout with RPC data.
