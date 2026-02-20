import { describe, it, expect } from 'vitest';
import { getPeriodRange, parsePeriodFromParams, PeriodPreset } from '@/lib/period';

describe('Period Utilities', () => {
  describe('getPeriodRange', () => {
    it('returns all-time preset without dates', () => {
      const result = getPeriodRange('all-time');
      expect(result).toEqual({
        preset: 'all-time',
      });
    });

    it('calculates last-7-days range correctly', () => {
      const result = getPeriodRange('last-7-days');
      expect(result.preset).toBe('last-7-days');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      // Verify dates are valid ISO strings
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('calculates last-30-days range correctly', () => {
      const result = getPeriodRange('last-30-days');
      expect(result.preset).toBe('last-30-days');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
    });

    it('calculates this-month range correctly', () => {
      const result = getPeriodRange('this-month');
      expect(result.preset).toBe('this-month');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      // Start date should be 1st of current month
      const now = new Date();
      const expectedStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      expect(result.startDate).toBe(expectedStart);
    });

    it('calculates this-quarter range correctly', () => {
      const result = getPeriodRange('this-quarter');
      expect(result.preset).toBe('this-quarter');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
    });

    it('calculates this-year range correctly', () => {
      const result = getPeriodRange('this-year');
      expect(result.preset).toBe('this-year');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      // Start date should be Jan 1st
      const now = new Date();
      const expectedStart = `${now.getFullYear()}-01-01`;
      expect(result.startDate).toBe(expectedStart);
      // End date should be Dec 31st
      const expectedEnd = `${now.getFullYear()}-12-31`;
      expect(result.endDate).toBe(expectedEnd);
    });

    it('returns custom preset without dates', () => {
      const result = getPeriodRange('custom');
      expect(result).toEqual({
        preset: 'custom',
      });
    });

    it('returns all-time for invalid preset', () => {
      const result = getPeriodRange('invalid' as PeriodPreset);
      expect(result).toEqual({
        preset: 'all-time',
      });
    });
  });

  describe('parsePeriodFromParams', () => {
    it('returns all-time for no params', () => {
      const params = new URLSearchParams();
      const result = parsePeriodFromParams(params);
      expect(result).toEqual({
        preset: 'all-time',
      });
    });

    it('parses valid period preset', () => {
      const params = new URLSearchParams('period=last-7-days');
      const result = parsePeriodFromParams(params);
      expect(result.preset).toBe('last-7-days');
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('includes startDate and endDate from params', () => {
      const params = new URLSearchParams('period=custom&startDate=2025-01-01&endDate=2025-01-31');
      const result = parsePeriodFromParams(params);
      expect(result.preset).toBe('custom');
      expect(result.startDate).toBe('2025-01-01');
      expect(result.endDate).toBe('2025-01-31');
    });

    it('handles startDate without endDate', () => {
      const params = new URLSearchParams('period=custom&startDate=2025-01-01');
      const result = parsePeriodFromParams(params);
      expect(result.preset).toBe('custom');
      expect(result.startDate).toBe('2025-01-01');
      expect(result.endDate).toBeUndefined();
    });

    it('handles endDate without startDate', () => {
      const params = new URLSearchParams('period=custom&endDate=2025-01-31');
      const result = parsePeriodFromParams(params);
      expect(result.preset).toBe('custom');
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBe('2025-01-31');
    });

    it('returns all-time for invalid period', () => {
      const params = new URLSearchParams('period=invalid');
      const result = parsePeriodFromParams(params);
      expect(result).toEqual({
        preset: 'all-time',
      });
    });

    it('ignores extra params', () => {
      const params = new URLSearchParams('period=last-30-days&extra=foo&bar=baz');
      const result = parsePeriodFromParams(params);
      expect(result.preset).toBe('last-30-days');
    });

    it('handles all valid presets', () => {
      const presets = ['all-time', 'last-7-days', 'last-30-days', 'this-month', 'this-quarter', 'this-year', 'custom'] as const;
      presets.forEach((preset) => {
        const params = new URLSearchParams(`period=${preset}`);
        const result = parsePeriodFromParams(params);
        expect(result.preset).toBe(preset);
      });
    });

    it('handles case-sensitive period values', () => {
      const params = new URLSearchParams('period=Last-7-Days');
      const result = parsePeriodFromParams(params);
      expect(result.preset).toBe('all-time'); // Should not match case-insensitive
    });
  });
});
