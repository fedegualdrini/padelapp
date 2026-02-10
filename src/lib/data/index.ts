// src/lib/data/index.ts - Barrel exports for data modules
// New code should import from specific modules

// Export from new modules (these are the preferred imports)
export * from './groups';
export * from './matches';

// Re-export additional types from original data.ts
export type {
  EloTimelinePoint,
  PlayerForm,
  MatchPrediction,
  HeadToHeadStats,
  PartnerStat,
  RecentMatch,
  AttendanceSummary,
  ActivityItem,
  CalendarEvent,
  CalendarMatch,
  CalendarDayData,
  CalendarData,
  PredictionAccuracy,
  PredictionFactor,
  PredictionFactors,
  OpponentRecord,
  WinRateTrendPoint,
  WinRateTrend,
} from '../data';

// Re-export functions not yet in modules (excluding ones already in groups/matches)
export {
  getMatchEditData,
  getPlayers,
  getPlayerStats,
  getPairAggregates,
  getUsualPairs,
  getPulseStats,
  getTopStats,
  getInviteMostPlayed,
  getEloLeaderboard,
  getEloTimeline,
  getPlayerEloChange,
  getPlayerRecentForm,
  predictMatchOutcome,
  getPlayerById,
  getPlayerPartnerStats,
  getPlayerRecentMatches,
  getHeadToHeadStats,
  getWeeklyEvents,
  getUpcomingOccurrences,
  getPastOccurrences,
  getAttendanceForOccurrence,
  getCurrentUserPlayerId,
  isGroupAdmin,
  getAttendanceSummary,
  getRecentActivity,
  getCalendarData,
  getPredictionAccuracy,
  getPredictionFactors,
  getOpponentRecord,
  getWinRateTrend,
} from '../data';
