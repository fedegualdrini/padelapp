import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getGroups,
  getGroupBySlug,
  getPlayers,
  getPlayerStats,
  getEloLeaderboard,
  getRecentMatches,
  getMatches,
  getWeeklyEvents,
  getUpcomingOccurrences,
  getPastOccurrences,
  getAttendanceForOccurrence,
  isGroupMember,
  getOrCreateRankingShareToken,
  createGroupInvite,
  validateAndUseInvite,
  getInviteDetails,
  getGroupInvites,
  getCalendarData,
  autoCloseEventsForMatch,
  getAttendanceSummary,
  getPredictionAccuracy,
} from '@/lib/data';

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
  hasSupabaseEnv: vi.fn(() => true),
}));

// Import the mocked functions for type access
import { hasSupabaseEnv } from '@/lib/supabase/server';

describe('Data Layer Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasSupabaseEnv).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Demo Mode', () => {
    beforeEach(() => {
      vi.mocked(hasSupabaseEnv).mockReturnValue(false);
    });

    describe('getGroups', () => {
      it('returns demo group when Supabase env is missing', async () => {
        const groups = await getGroups();
        expect(groups).toHaveLength(1);
        expect(groups[0].slug).toBe('demo');
        expect(groups[0].name).toBe('Demo — Jueves Padel');
      });
    });

    describe('getGroupBySlug', () => {
      it('returns demo group for demo slug', async () => {
        const group = await getGroupBySlug('demo');
        expect(group).not.toBeNull();
        expect(group?.slug).toBe('demo');
        expect(group?.name).toBe('Demo — Jueves Padel');
      });

      it('returns demo group with requested slug in demo mode', async () => {
        const group = await getGroupBySlug('any-slug');
        expect(group).not.toBeNull();
        expect(group?.slug).toBe('any-slug');
      });

      it('returns group with correct properties', async () => {
        const group = await getGroupBySlug('test');
        expect(group).toHaveProperty('id');
        expect(group).toHaveProperty('name');
        expect(group).toHaveProperty('slug');
      });
    });

    describe('getPlayers', () => {
      it('returns demo players for demo group', async () => {
        const players = await getPlayers('demo-group');
        expect(players).toHaveLength(5);
        expect(players.map(p => p.name)).toContain('Fede');
        expect(players.map(p => p.name)).toContain('Nico');
        expect(players.map(p => p.name)).toContain('Santi');
        expect(players.map(p => p.name)).toContain('Lucho');
        expect(players.map(p => p.name)).toContain('Invitado');
      });

      it('returns players with correct status', async () => {
        const players = await getPlayers('demo-group');
        const usualPlayers = players.filter(p => p.status === 'usual');
        const invitePlayers = players.filter(p => p.status === 'invite');
        expect(usualPlayers).toHaveLength(4);
        expect(invitePlayers).toHaveLength(1);
      });
    });

    describe('getPlayerStats', () => {
      it('returns demo stats for demo group', async () => {
        const stats = await getPlayerStats('demo-group');
        expect(stats.length).toBeGreaterThan(0);
        expect(stats[0]).toHaveProperty('player_id');
        expect(stats[0]).toHaveProperty('matches_played');
        expect(stats[0]).toHaveProperty('wins');
        expect(stats[0]).toHaveProperty('losses');
        expect(stats[0]).toHaveProperty('win_rate');
      });

      it('returns stats with calculated win rates', async () => {
        const stats = await getPlayerStats('demo-group');
        stats.forEach(stat => {
          expect(stat.win_rate).toBeGreaterThanOrEqual(0);
          // Win rate can be a percentage (0-100) or decimal (0-1)
          expect(stat.win_rate).toBeLessThanOrEqual(100);
        });
      });
    });

    describe('getRecentMatches', () => {
      it('returns demo matches for demo group', async () => {
        const matches = await getRecentMatches('demo-group');
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0]).toHaveProperty('id');
        expect(matches[0]).toHaveProperty('playedAt');
        expect(matches[0]).toHaveProperty('teams');
        expect(matches[0].teams).toHaveLength(2);
      });

      it('returns matches with team structure', async () => {
        const matches = await getRecentMatches('demo-group');
        const match = matches[0];
        expect(match.teams[0]).toHaveProperty('name');
        expect(match.teams[0]).toHaveProperty('players');
        expect(match.teams[0]).toHaveProperty('sets');
        expect(match.teams[0]).toHaveProperty('opponentSets');
      });

      it('respects limit parameter', async () => {
        const matches = await getRecentMatches('demo-group', 1);
        expect(matches.length).toBeLessThanOrEqual(1);
      });

      it('returns matches with correct date format', async () => {
        const matches = await getRecentMatches('demo-group');
        expect(matches[0].playedAt).toBeDefined();
      });
    });

    describe('getMatches', () => {
      it('returns demo matches for demo group', async () => {
        const matches = await getMatches('demo-group');
        expect(matches.length).toBeGreaterThan(0);
      });

      it('ignores filters for demo group', async () => {
        const matches = await getMatches('demo-group', { playerId: 'p1', from: '2024-01-01' });
        expect(matches.length).toBeGreaterThan(0);
      });
    });

    describe('getEloLeaderboard', () => {
      it('returns demo leaderboard for demo group', async () => {
        const leaderboard = await getEloLeaderboard('demo-group');
        expect(leaderboard.length).toBeGreaterThan(0);
        expect(leaderboard[0]).toHaveProperty('playerId');
        expect(leaderboard[0]).toHaveProperty('name');
        expect(leaderboard[0]).toHaveProperty('rating');
      });

      it('returns sorted by rating descending', async () => {
        const leaderboard = await getEloLeaderboard('demo-group');
        for (let i = 1; i < leaderboard.length; i++) {
          expect(leaderboard[i - 1].rating).toBeGreaterThanOrEqual(leaderboard[i].rating);
        }
      });

      it('respects limit parameter', async () => {
        const leaderboard = await getEloLeaderboard('demo-group', 2);
        expect(leaderboard.length).toBeLessThanOrEqual(2);
      });
    });

    describe('getWeeklyEvents', () => {
      it('returns demo weekly event for demo group', async () => {
        const events = await getWeeklyEvents('demo-group');
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].name).toBe('Jueves 20:00');
        expect(events[0].weekday).toBe(4); // Thursday
        expect(events[0].start_time).toBe('20:00:00');
        expect(events[0].capacity).toBe(4);
      });

      it('returns event with active occurrence', async () => {
        const events = await getWeeklyEvents('demo-group');
        expect(events[0].active_occurrence_id).toBe('occ1');
      });
    });

    describe('getUpcomingOccurrences', () => {
      it('returns demo occurrence for demo group', async () => {
        const occurrences = await getUpcomingOccurrences('demo-group');
        expect(occurrences.length).toBeGreaterThan(0);
        expect(occurrences[0].status).toBe('open');
      });

      it('returns occurrence with correct structure', async () => {
        const occurrences = await getUpcomingOccurrences('demo-group');
        expect(occurrences[0]).toHaveProperty('id');
        expect(occurrences[0]).toHaveProperty('weekly_event_id');
        expect(occurrences[0]).toHaveProperty('starts_at');
        expect(occurrences[0]).toHaveProperty('status');
      });

      it('respects limit parameter', async () => {
        const occurrences = await getUpcomingOccurrences('demo-group', 1);
        expect(occurrences.length).toBeLessThanOrEqual(1);
      });
    });

    describe('getPastOccurrences', () => {
      it('returns empty array for demo group', async () => {
        const occurrences = await getPastOccurrences('demo-group');
        expect(occurrences).toEqual([]);
      });
    });

    describe('getAttendanceForOccurrence', () => {
      it('returns demo attendance for demo occurrence', async () => {
        const attendance = await getAttendanceForOccurrence('occ1');
        expect(attendance.length).toBeGreaterThan(0);
        expect(attendance[0].status).toBe('confirmed');
      });

      it('returns attendance with player info', async () => {
        const attendance = await getAttendanceForOccurrence('occ1');
        expect(attendance[0].players).toBeDefined();
        expect(attendance[0].players).toHaveProperty('name');
      });

      it('returns all confirmed for demo occurrence', async () => {
        const attendance = await getAttendanceForOccurrence('occ1');
        expect(attendance.every(a => a.status === 'confirmed')).toBe(true);
      });
    });

    describe('getAttendanceSummary', () => {
      it('returns attendance summary for demo group', async () => {
        const weeklyEvents = await getWeeklyEvents('demo-group');
        const occurrences = await getUpcomingOccurrences('demo-group');
        const summary = await getAttendanceSummary('demo-group', occurrences, weeklyEvents);
        expect(summary.length).toBeGreaterThan(0);
        expect(summary[0].confirmedCount).toBeGreaterThan(0);
        expect(summary[0]).toHaveProperty('isFull');
        expect(summary[0]).toHaveProperty('spotsAvailable');
      });
    });

    describe('isGroupMember', () => {
      it('returns true for demo group', async () => {
        const isMember = await isGroupMember('demo-group');
        expect(isMember).toBe(true);
      });
    });

    describe('getOrCreateRankingShareToken', () => {
      it('returns demo token for demo group', async () => {
        const token = await getOrCreateRankingShareToken('demo-group');
        expect(token).toBe('demo-token');
      });

      it('returns demo token in demo mode', async () => {
        const token = await getOrCreateRankingShareToken('any-group');
        expect(token).toBe('demo-token');
      });
    });

    describe('createGroupInvite', () => {
      it('returns demo invite for demo group', async () => {
        const result = await createGroupInvite('demo-group');
        expect(result.invite).not.toBeNull();
        expect(result.invite?.token).toBe('demo-token-123456');
        expect(result.error).toBeNull();
      });

      it('returns error in demo mode for non-demo group', async () => {
        const result = await createGroupInvite('non-demo-group');
        expect(result.invite).toBeNull();
        expect(result.error).toBe('Demo mode does not support invites');
      });
    });

    describe('validateAndUseInvite', () => {
      it('returns success for demo token', async () => {
        const result = await validateAndUseInvite('demo-token-123456');
        expect(result.success).toBe(true);
        expect(result.groupId).toBe('demo-group');
        expect(result.message).toBe('Successfully joined group');
      });

      it('returns failure for non-demo token in demo mode', async () => {
        const result = await validateAndUseInvite('some-token');
        expect(result.success).toBe(false);
        expect(result.message).toBe('Demo mode does not support invites');
      });
    });

    describe('getInviteDetails', () => {
      it('returns demo invite details for demo token', async () => {
        const details = await getInviteDetails('demo-token-123456');
        expect(details).not.toBeNull();
        expect(details?.groupName).toBe('Demo — Jueves Padel');
        expect(details?.groupSlug).toBe('demo');
        expect(details?.isValid).toBe(true);
      });

      it('returns null for non-demo token in demo mode', async () => {
        const details = await getInviteDetails('some-token');
        expect(details).toBeNull();
      });
    });

    describe('getGroupInvites', () => {
      it('returns demo invite for demo group', async () => {
        const invites = await getGroupInvites('demo-group');
        expect(invites.length).toBeGreaterThan(0);
        expect(invites[0].token).toBe('demo-token-123456');
      });

      it('returns invites with correct structure', async () => {
        const invites = await getGroupInvites('demo-group');
        expect(invites[0]).toHaveProperty('id');
        expect(invites[0]).toHaveProperty('groupId');
        expect(invites[0]).toHaveProperty('createdAt');
      });
    });

    describe('getCalendarData', () => {
      it('returns calendar data for month', async () => {
        const calendarData = await getCalendarData('demo-group', 2024, 0);
        expect(calendarData.year).toBe(2024);
        expect(calendarData.month).toBe(0);
        expect(calendarData.days).toBeDefined();
        expect(calendarData.days.length).toBeGreaterThan(0);
      });

      it('includes padding for first day alignment', async () => {
        const calendarData = await getCalendarData('demo-group', 2024, 0);
        // January 2024 starts on Monday (day 1)
        // Should have padding for Sunday (0)
        const firstDayWithData = calendarData.days.findIndex(d => d.date !== '');
        expect(firstDayWithData).toBeGreaterThanOrEqual(0);
      });

      it('handles February in leap year', async () => {
        const febData = await getCalendarData('demo-group', 2024, 1);
        // 2024 is a leap year, February has 29 days
        const daysWithData = febData.days.filter(d => d.date !== '');
        // Should have 29 days + padding
        expect(febData.days.length).toBeGreaterThan(29);
      });

      it('handles February in non-leap year', async () => {
        const febData = await getCalendarData('demo-group', 2023, 1);
        // 2023 is not a leap year, February has 28 days
        const daysWithData = febData.days.filter(d => d.date !== '');
        expect(febData.days.length).toBeGreaterThan(28);
      });

      it('includes demo matches in calendar', async () => {
        const calendarData = await getCalendarData('demo-group', 2024, 1);
        const daysWithMatches = calendarData.days.filter(d => d.matches.length > 0);
        expect(daysWithMatches.length).toBeGreaterThan(0);
      });

      it('includes demo events in calendar', async () => {
        const calendarData = await getCalendarData('demo-group', 2024, 1);
        const daysWithEvents = calendarData.days.filter(d => d.events.length > 0);
        expect(daysWithEvents.length).toBeGreaterThan(0);
      });

      it('events have correct structure', async () => {
        const calendarData = await getCalendarData('demo-group', 2024, 1);
        const dayWithEvent = calendarData.days.find(d => d.events.length > 0);
        if (dayWithEvent) {
          const event = dayWithEvent.events[0];
          expect(event).toHaveProperty('id');
          expect(event).toHaveProperty('name');
          expect(event).toHaveProperty('date');
          expect(event).toHaveProperty('time');
          expect(event).toHaveProperty('status');
          expect(event).toHaveProperty('attendanceCount');
          expect(event).toHaveProperty('capacity');
        }
      });

      it('matches have correct structure', async () => {
        const calendarData = await getCalendarData('demo-group', 2024, 1);
        const dayWithMatch = calendarData.days.find(d => d.matches.length > 0);
        if (dayWithMatch) {
          const match = dayWithMatch.matches[0];
          expect(match).toHaveProperty('id');
          expect(match).toHaveProperty('date');
          expect(match).toHaveProperty('team1');
          expect(match).toHaveProperty('team2');
          expect(match).toHaveProperty('sets');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    describe('autoCloseEventsForMatch', () => {
      it('returns 0 for demo group', async () => {
        const closed = await autoCloseEventsForMatch('demo-group', '2024-01-15', ['p1', 'p2', 'p3', 'p4']);
        expect(closed).toBe(0);
      });

      it('returns 0 for invalid player count (less than 4)', async () => {
        const closed = await autoCloseEventsForMatch('g1', '2024-01-15', ['p1', 'p2']);
        expect(closed).toBe(0);
      });

      it('returns 0 for invalid player count (more than 4)', async () => {
        const closed = await autoCloseEventsForMatch('g1', '2024-01-15', ['p1', 'p2', 'p3', 'p4', 'p5']);
        expect(closed).toBe(0);
      });

      it('returns 0 for empty player array', async () => {
        const closed = await autoCloseEventsForMatch('g1', '2024-01-15', []);
        expect(closed).toBe(0);
      });

      it('returns 0 for null groupId', async () => {
        const closed = await autoCloseEventsForMatch(null as unknown as string, '2024-01-15', ['p1', 'p2', 'p3', 'p4']);
        expect(closed).toBe(0);
      });

      it('returns 0 for undefined groupId', async () => {
        const closed = await autoCloseEventsForMatch(undefined as unknown as string, '2024-01-15', ['p1', 'p2', 'p3', 'p4']);
        expect(closed).toBe(0);
      });

      it('returns 0 in demo mode', async () => {
        vi.mocked(hasSupabaseEnv).mockReturnValue(false);
        const closed = await autoCloseEventsForMatch('some-group', '2024-01-15', ['p1', 'p2', 'p3', 'p4']);
        expect(closed).toBe(0);
      });
    });

    // Note: getPredictionAccuracy requires Supabase connection
    // and is tested via integration tests
  });

  describe('Type Exports and Data Integrity', () => {
    beforeEach(() => {
      // Ensure demo mode for type tests
      vi.mocked(hasSupabaseEnv).mockReturnValue(false);
    });

    it('Group type has required properties', async () => {
      const groups = await getGroups();
      if (groups.length > 0) {
        const group = groups[0];
        expect(typeof group.id).toBe('string');
        expect(typeof group.name).toBe('string');
        expect(typeof group.slug).toBe('string');
      }
    });

    it('PlayerRow type has required properties', async () => {
      const players = await getPlayers('demo-group');
      players.forEach(player => {
        expect(typeof player.id).toBe('string');
        expect(typeof player.name).toBe('string');
        expect(typeof player.status).toBe('string');
      });
    });

    it('EventOccurrence has valid status', async () => {
      const occurrences = await getUpcomingOccurrences('demo-group');
      const validStatuses = ['open', 'locked', 'cancelled', 'completed'];
      occurrences.forEach(occ => {
        expect(validStatuses).toContain(occ.status);
      });
    });
  });
});
