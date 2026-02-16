# Owner Notes

> Fede's guidance for the Padel team

## Vision
Build the best padel tracker for casual groups. Keep it simple, fun, and fair.

## Current Focus: Product-First
**Monetization is on hold** until we nail these three things:
1. ✅ Product - Features work well, no major bugs
2. ✅ User Base - Happy players using the app regularly
3. ✅ UI/UX - Polished, intuitive, mobile-first experience

**In Other Words:** Make something people love first, then figure out how to make money from it.

## Hero Metrics (Track These)
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Daily active users | ? | 100+ | 🔍 Need to measure |
| Match recordings / week | ? | 50+ | 🔍 Need to measure |
| Mobile UX score | ? | 8/10 | 🔄 Jordan working on it |
| Feature completeness | 70% | 90% | 📊 Audit in progress |

## What We're NOT Doing Right Now
- ❌ Reaching out to clubs for B2B partnerships
- ❌ Building premium/paid features
- ❌ Pitch decks or monetization pilots
- ❌ Any paywalls or subscription features

## What We ARE Doing
- ✅ Fixing mobile responsiveness (Jordan)
- ✅ Identifying UX quick wins (Maya)
- ✅ Polishing existing features
- ✅ Adding DB performance (Chris)
- ✅ Hardening CI/CD (Taylor)

## Feedback on Team Work
- Chris: Great DB audit! Add the indexes you suggested. Keep focusing on performance.
- Sam: **Pivot** - Instead of B2B monetization research, focus on **user growth strategies**. What makes users stick? What features drive engagement?
- Jordan: Mobile fix is #1 priority. Casual players are on phones.
- Maya: Find the top 3 UX quick wins from audit. What small changes have big impact?
- Taylor: Getting E2E in CI is great. This will let us ship faster.

## Do Not Touch
- Don't modify ELO calculation without my approval
- Don't add paywalls to core features
- Don't remove existing free features

## Sam's New Mission: Growth & Retention
Since monetization is on hold, Sam should focus on:
1. **User feedback** - How do current users feel? What do they love/hate?
2. **Retention analysis** - Why do people stop using the app?
3. **Viral features** - What makes users invite friends?
4. **Competitive gaps** - What do competitors have that we don't?

Report findings to #padel-team weekly.

## My Existing Contacts (For Later)
- Club X - I know the owner (save for when we're ready)
- Club Y - played there before (save for when we're ready)

## 🐛 Known Bugs (Reported)

### Events Section - Attendee Selection Bug
**Issue**: When selecting members who will attend an event, the dropdown menu only shows "usuals" players, not "invites" 
**Expected**: Both usuals AND invites should appear in the attendance dropdown
**Impact**: Users can't mark invite players as attending events
**Tags**: @Chris @Jordan 
**Status**: 🔴 Open - Needs investigation

**Steps to reproduce:**
1. Go to Events/Calendar section
2. Create or edit an event occurrence
3. Try to select attendees
4. Dropdown only lists "usuals", missing "invites"

**Technical notes:**
- Likely a filtering issue in the attendee query
- Check Supabase query for event attendance
- May need to JOIN with players table using correct status filter
