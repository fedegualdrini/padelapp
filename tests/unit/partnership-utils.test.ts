import { describe, it, expect } from 'vitest';
import {
  calculateSynergyScore,
  getPartnershipTier,
  getMatchesBadge,
  getEloDeltaIndicator,
  type Partnership,
} from '@/lib/partnership-types';

describe('Partnership Utilities', () => {
  const mockPartnership: Partnership = {
    player1_id: 'player1',
    player2_id: 'player2',
    matches_played: 10,
    wins: 7,
    losses: 3,
    win_rate: 0.7,
    avg_elo_change_when_paired: 15,
    avg_individual_elo_change: 8,
    elo_change_delta: 7,
    common_opponents_beaten: 5,
    first_played_together: '2024-01-01',
    last_played_together: '2024-12-31',
    refreshed_at: '2025-01-01',
  };

  describe('calculateSynergyScore', () => {
    it('calculates synergy score with default weights', () => {
      const result = calculateSynergyScore(mockPartnership);
      // win_rate: 0.7 * 0.5 = 0.35
      // elo_delta: 7/100 = 0.07 * 0.3 = 0.021
      // opponent_quality: 5/10 = 0.5 * 0.2 = 0.1
      // Total: 0.35 + 0.021 + 0.1 = 0.471
      expect(result).toBeCloseTo(0.471, 3);
    });

    it('calculates synergy score with custom weights', () => {
      const result = calculateSynergyScore(mockPartnership, {
        win_rate_weight: 0.6,
        elo_delta_weight: 0.2,
        opponent_quality_weight: 0.2,
      });
      // win_rate: 0.7 * 0.6 = 0.42
      // elo_delta: 0.07 * 0.2 = 0.014
      // opponent_quality: 0.5 * 0.2 = 0.1
      // Total: 0.42 + 0.014 + 0.1 = 0.534
      expect(result).toBeCloseTo(0.534, 3);
    });

    it('handles zero matches played', () => {
      const partnership = { ...mockPartnership, matches_played: 0, common_opponents_beaten: 0 };
      const result = calculateSynergyScore(partnership);
      // opponent_quality should be 0 when matches_played is 0
      // win_rate: 0.7 * 0.5 = 0.35, elo_delta: 0.07 * 0.3 = 0.021
      expect(result).toBeCloseTo(0.371, 3); // win_rate + elo_delta contribution
    });

    it('clamps positive ELO delta to max 1', () => {
      const partnership = { ...mockPartnership, elo_change_delta: 200 };
      const result = calculateSynergyScore(partnership);
      // elo_delta: 200/100 = 2, clamped to 1 * 0.3 = 0.3
      const maxEloContribution = 0.3;
      const otherContributions = 0.7 * 0.5 + 0.5 * 0.2; // win_rate + opponent_quality
      expect(result).toBeCloseTo(maxEloContribution + otherContributions, 3);
    });

    it('clamps negative ELO delta to min -1', () => {
      const partnership = { ...mockPartnership, elo_change_delta: -200 };
      const result = calculateSynergyScore(partnership);
      // elo_delta: -200/100 = -2, clamped to -1 * 0.3 = -0.3
      const minEloContribution = -0.3;
      const otherContributions = 0.7 * 0.5 + 0.5 * 0.2;
      expect(result).toBeCloseTo(minEloContribution + otherContributions, 3);
    });

    it('calculates zero ELO delta correctly', () => {
      const partnership = { ...mockPartnership, elo_change_delta: 0 };
      const result = calculateSynergyScore(partnership);
      const otherContributions = 0.7 * 0.5 + 0.5 * 0.2;
      expect(result).toBeCloseTo(otherContributions, 3);
    });

    it('handles perfect win rate', () => {
      const partnership = { ...mockPartnership, win_rate: 1 };
      const result = calculateSynergyScore(partnership);
      const winRateContribution = 1 * 0.5;
      const otherContributions = 0.07 * 0.3 + 0.5 * 0.2;
      expect(result).toBeCloseTo(winRateContribution + otherContributions, 3);
    });

    it('handles zero win rate', () => {
      const partnership = { ...mockPartnership, win_rate: 0 };
      const result = calculateSynergyScore(partnership);
      const winRateContribution = 0;
      const otherContributions = 0.07 * 0.3 + 0.5 * 0.2;
      expect(result).toBeCloseTo(winRateContribution + otherContributions, 3);
    });

    it('normalizes opponents beaten when greater than matches', () => {
      const partnership = { ...mockPartnership, common_opponents_beaten: 15, matches_played: 10 };
      const result = calculateSynergyScore(partnership);
      // opponent_quality: 15/10 = 1.5, clamped to 1 * 0.2 = 0.2
      const opponentContribution = 0.2;
      const otherContributions = 0.7 * 0.5 + 0.07 * 0.3;
      expect(result).toBeCloseTo(opponentContribution + otherContributions, 3);
    });

    it('calculates synergy for high ELO delta', () => {
      const partnership = { ...mockPartnership, elo_change_delta: 50 };
      const result = calculateSynergyScore(partnership);
      const eloContribution = 0.5 * 0.3; // 50/100 = 0.5
      const otherContributions = 0.7 * 0.5 + 0.5 * 0.2;
      expect(result).toBeCloseTo(eloContribution + otherContributions, 3);
    });

    it('calculates synergy for negative ELO delta', () => {
      const partnership = { ...mockPartnership, elo_change_delta: -30 };
      const result = calculateSynergyScore(partnership);
      const eloContribution = -0.3 * 0.3; // -30/100 = -0.3
      const otherContributions = 0.7 * 0.5 + 0.5 * 0.2;
      expect(result).toBeCloseTo(eloContribution + otherContributions, 3);
    });
  });

  describe('getPartnershipTier', () => {
    it('returns excellent for win rate >= 0.7', () => {
      expect(getPartnershipTier(0.7)).toBe('excellent');
      expect(getPartnershipTier(0.75)).toBe('excellent');
      expect(getPartnershipTier(1.0)).toBe('excellent');
    });

    it('returns good for win rate >= 0.6 and < 0.7', () => {
      expect(getPartnershipTier(0.6)).toBe('good');
      expect(getPartnershipTier(0.65)).toBe('good');
      expect(getPartnershipTier(0.69)).toBe('good');
    });

    it('returns fair for win rate >= 0.5 and < 0.6', () => {
      expect(getPartnershipTier(0.5)).toBe('fair');
      expect(getPartnershipTier(0.55)).toBe('fair');
      expect(getPartnershipTier(0.59)).toBe('fair');
    });

    it('returns poor for win rate < 0.5', () => {
      expect(getPartnershipTier(0)).toBe('poor');
      expect(getPartnershipTier(0.3)).toBe('poor');
      expect(getPartnershipTier(0.49)).toBe('poor');
    });

    it('handles boundary values correctly', () => {
      expect(getPartnershipTier(0.6999)).toBe('good');
      expect(getPartnershipTier(0.5999)).toBe('fair');
      expect(getPartnershipTier(0.4999)).toBe('poor');
    });
  });

  describe('getMatchesBadge', () => {
    it('returns Established for matches >= 10', () => {
      expect(getMatchesBadge(10)).toBe('Established');
      expect(getMatchesBadge(15)).toBe('Established');
      expect(getMatchesBadge(100)).toBe('Established');
    });

    it('returns Developing for matches >= 5 and < 10', () => {
      expect(getMatchesBadge(5)).toBe('Developing');
      expect(getMatchesBadge(7)).toBe('Developing');
      expect(getMatchesBadge(9)).toBe('Developing');
    });

    it('returns New for matches < 5', () => {
      expect(getMatchesBadge(0)).toBe('New');
      expect(getMatchesBadge(1)).toBe('New');
      expect(getMatchesBadge(3)).toBe('New');
      expect(getMatchesBadge(4)).toBe('New');
    });

    it('handles boundary values correctly', () => {
      expect(getMatchesBadge(4.99)).toBe('New');
      expect(getMatchesBadge(9.99)).toBe('Developing');
    });
  });

  describe('getEloDeltaIndicator', () => {
    it('returns positive for delta > 2', () => {
      expect(getEloDeltaIndicator(3)).toBe('positive');
      expect(getEloDeltaIndicator(10)).toBe('positive');
      expect(getEloDeltaIndicator(100)).toBe('positive');
    });

    it('returns negative for delta < -2', () => {
      expect(getEloDeltaIndicator(-3)).toBe('negative');
      expect(getEloDeltaIndicator(-10)).toBe('negative');
      expect(getEloDeltaIndicator(-100)).toBe('negative');
    });

    it('returns neutral for delta between -2 and 2', () => {
      expect(getEloDeltaIndicator(-2)).toBe('neutral');
      expect(getEloDeltaIndicator(-1)).toBe('neutral');
      expect(getEloDeltaIndicator(0)).toBe('neutral');
      expect(getEloDeltaIndicator(1)).toBe('neutral');
      expect(getEloDeltaIndicator(2)).toBe('neutral');
    });

    it('handles boundary values correctly', () => {
      expect(getEloDeltaIndicator(2.01)).toBe('positive');
      expect(getEloDeltaIndicator(-2.01)).toBe('negative');
      expect(getEloDeltaIndicator(1.99)).toBe('neutral');
      expect(getEloDeltaIndicator(-1.99)).toBe('neutral');
    });
  });
});
