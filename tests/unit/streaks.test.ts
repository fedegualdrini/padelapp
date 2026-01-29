import { describe, expect, it } from 'vitest';

// Helper function to simulate the streak calculation logic
type MatchResult = {
  match_id: string;
  is_win: boolean;
  played_at: string;
};

type StreakHistoryItem = {
  streak: number;
  type: "win" | "loss";
  startMatchId: string;
  endMatchId: string;
  startDate: string;
  endDate: string;
};

type PlayerStreaks = {
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  streakHistory: StreakHistoryItem[];
};

function calculateStreaks(matchResults: MatchResult[]): PlayerStreaks {
  if (matchResults.length === 0) {
    return {
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      streakHistory: [],
    };
  }

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  const streakHistory: StreakHistoryItem[] = [];

  let currentStreakType: "win" | "loss" | null = null;
  let currentStreakCount = 0;
  let currentStreakStart: { matchId: string; date: string } | null = null;

  for (let i = 0; i < matchResults.length; i++) {
    const match = matchResults[i];
    const isWin = match.is_win;

    if (currentStreakType === null) {
      currentStreakType = isWin ? "win" : "loss";
      currentStreakCount = 1;
      currentStreakStart = { matchId: match.match_id, date: match.played_at };
    } else if (
      (currentStreakType === "win" && isWin) ||
      (currentStreakType === "loss" && !isWin)
    ) {
      currentStreakCount++;
    } else {
      if (currentStreakStart && currentStreakCount >= 2) {
        streakHistory.push({
          streak: currentStreakCount,
          type: currentStreakType,
          startMatchId: currentStreakStart.matchId,
          endMatchId: matchResults[i - 1].match_id,
          startDate: currentStreakStart.date,
          endDate: matchResults[i - 1].played_at,
        });
      }

      if (currentStreakType === "win") {
        longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
      } else {
        longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
      }

      currentStreakType = isWin ? "win" : "loss";
      currentStreakCount = 1;
      currentStreakStart = { matchId: match.match_id, date: match.played_at };
    }
  }

  if (currentStreakStart && currentStreakCount > 0 && currentStreakType) {
    const lastMatch = matchResults[matchResults.length - 1];

    if (currentStreakType === "win") {
      longestWinStreak = Math.max(longestWinStreak, currentStreakCount);
    } else {
      longestLossStreak = Math.max(longestLossStreak, currentStreakCount);
    }

    const currentStreak = currentStreakType === "win" ? currentStreakCount : -currentStreakCount;

    if (currentStreakCount >= 2) {
      streakHistory.push({
        streak: currentStreakCount,
        type: currentStreakType,
        startMatchId: currentStreakStart.matchId,
        endMatchId: lastMatch.match_id,
        startDate: currentStreakStart.date,
        endDate: lastMatch.played_at,
      });
    }

    return {
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      streakHistory,
    };
  }

  return {
    currentStreak: 0,
    longestWinStreak,
    longestLossStreak,
    streakHistory,
  };
}

describe('Streak Calculation', () => {
  it('returns empty streaks for no matches', () => {
    const result = calculateStreaks([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestWinStreak).toBe(0);
    expect(result.longestLossStreak).toBe(0);
    expect(result.streakHistory).toEqual([]);
  });

  it('calculates single win streak', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: true, played_at: '2024-01-01' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(1);
    expect(result.longestWinStreak).toBe(1);
    expect(result.longestLossStreak).toBe(0);
    expect(result.streakHistory).toEqual([]); // Single streak not in history
  });

  it('calculates single loss streak', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: false, played_at: '2024-01-01' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(-1);
    expect(result.longestWinStreak).toBe(0);
    expect(result.longestLossStreak).toBe(1);
    expect(result.streakHistory).toEqual([]);
  });

  it('calculates consecutive win streak', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: true, played_at: '2024-01-01' },
      { match_id: '2', is_win: true, played_at: '2024-01-02' },
      { match_id: '3', is_win: true, played_at: '2024-01-03' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(3);
    expect(result.longestWinStreak).toBe(3);
    expect(result.longestLossStreak).toBe(0);
    expect(result.streakHistory).toHaveLength(1);
    expect(result.streakHistory[0].streak).toBe(3);
    expect(result.streakHistory[0].type).toBe('win');
  });

  it('calculates consecutive loss streak', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: false, played_at: '2024-01-01' },
      { match_id: '2', is_win: false, played_at: '2024-01-02' },
      { match_id: '3', is_win: false, played_at: '2024-01-03' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(-3);
    expect(result.longestWinStreak).toBe(0);
    expect(result.longestLossStreak).toBe(3);
    expect(result.streakHistory).toHaveLength(1);
    expect(result.streakHistory[0].streak).toBe(3);
    expect(result.streakHistory[0].type).toBe('loss');
  });

  it('handles alternating win/loss pattern', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: true, played_at: '2024-01-01' },
      { match_id: '2', is_win: false, played_at: '2024-01-02' },
      { match_id: '3', is_win: true, played_at: '2024-01-03' },
      { match_id: '4', is_win: false, played_at: '2024-01-04' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(-1);
    expect(result.longestWinStreak).toBe(1);
    expect(result.longestLossStreak).toBe(1);
    expect(result.streakHistory).toEqual([]); // No streaks >= 2
  });

  it('handles broken streaks (win, win, loss, win)', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: true, played_at: '2024-01-01' },
      { match_id: '2', is_win: true, played_at: '2024-01-02' },
      { match_id: '3', is_win: false, played_at: '2024-01-03' },
      { match_id: '4', is_win: true, played_at: '2024-01-04' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(1);
    expect(result.longestWinStreak).toBe(2);
    expect(result.longestLossStreak).toBe(1);
    expect(result.streakHistory).toHaveLength(1);
    expect(result.streakHistory[0].streak).toBe(2);
    expect(result.streakHistory[0].type).toBe('win');
  });

  it('tracks multiple streaks in history', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: true, played_at: '2024-01-01' },
      { match_id: '2', is_win: true, played_at: '2024-01-02' },
      { match_id: '3', is_win: true, played_at: '2024-01-03' },
      { match_id: '4', is_win: false, played_at: '2024-01-04' },
      { match_id: '5', is_win: false, played_at: '2024-01-05' },
      { match_id: '6', is_win: true, played_at: '2024-01-06' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(1);
    expect(result.longestWinStreak).toBe(3);
    expect(result.longestLossStreak).toBe(2);
    expect(result.streakHistory).toHaveLength(2);
    expect(result.streakHistory[0].streak).toBe(3); // First win streak
    expect(result.streakHistory[0].type).toBe('win');
    expect(result.streakHistory[1].streak).toBe(2); // Loss streak
    expect(result.streakHistory[1].type).toBe('loss');
  });

  it('correctly identifies longest streaks not at the end', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: true, played_at: '2024-01-01' },
      { match_id: '2', is_win: true, played_at: '2024-01-02' },
      { match_id: '3', is_win: true, played_at: '2024-01-03' },
      { match_id: '4', is_win: true, played_at: '2024-01-04' },
      { match_id: '5', is_win: false, played_at: '2024-01-05' },
      { match_id: '6', is_win: true, played_at: '2024-01-06' },
      { match_id: '7', is_win: true, played_at: '2024-01-07' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(2);
    expect(result.longestWinStreak).toBe(4); // The first streak of 4
    expect(result.longestLossStreak).toBe(1);
  });

  it('handles complex pattern with multiple streaks', () => {
    const matches: MatchResult[] = [
      { match_id: '1', is_win: true, played_at: '2024-01-01' },
      { match_id: '2', is_win: true, played_at: '2024-01-02' },
      { match_id: '3', is_win: false, played_at: '2024-01-03' },
      { match_id: '4', is_win: false, played_at: '2024-01-04' },
      { match_id: '5', is_win: false, played_at: '2024-01-05' },
      { match_id: '6', is_win: true, played_at: '2024-01-06' },
      { match_id: '7', is_win: true, played_at: '2024-01-07' },
      { match_id: '8', is_win: true, played_at: '2024-01-08' },
      { match_id: '9', is_win: false, played_at: '2024-01-09' },
    ];
    const result = calculateStreaks(matches);
    expect(result.currentStreak).toBe(-1);
    expect(result.longestWinStreak).toBe(3);
    expect(result.longestLossStreak).toBe(3);
    expect(result.streakHistory).toHaveLength(3);
  });
});
