import { describe, it, expect } from 'vitest';
import { getPeriodRange, parsePeriodFromParams, PeriodPreset } from '@/lib/period';

describe('getPeriodRange', () => {
  it('returns all-time preset with no dates', () => {
    const result = getPeriodRange('all-time');
    expect(result.preset).toBe('all-time');
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });

  it('calculates last 7 days relative to current date', () => {
    const result = getPeriodRange('last-7-days');
    expect(result.preset).toBe('last-7-days');
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();

    // Verify dates are in YYYY-MM-DD format
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify start date is before end date
    expect(new Date(result.startDate!).getTime()).toBeLessThan(new Date(result.endDate!).getTime());
  });

  it('calculates last 30 days relative to current date', () => {
    const result = getPeriodRange('last-30-days');
    expect(result.preset).toBe('last-30-days');
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();

    // Verify dates are in YYYY-MM-DD format
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify start date is before end date
    expect(new Date(result.startDate!).getTime()).toBeLessThan(new Date(result.endDate!).getTime());
  });

  it('calculates this month correctly', () => {
    const result = getPeriodRange('this-month');
    expect(result.preset).toBe('this-month');
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();

    // Verify dates are in YYYY-MM-DD format
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify the start date is the 1st of the month
    expect(result.endDate!.endsWith('01')).toBe(false);
  });

  it('calculates this quarter correctly', () => {
    const result = getPeriodRange('this-quarter');
    expect(result.preset).toBe('this-quarter');
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();

    // Verify dates are in YYYY-MM-DD format
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify start date is before end date
    expect(new Date(result.startDate!).getTime()).toBeLessThan(new Date(result.endDate!).getTime());
  });

  it('calculates this year correctly', () => {
    const result = getPeriodRange('this-year');
    expect(result.preset).toBe('this-year');
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();

    // Verify dates are in YYYY-MM-DD format
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify start date is January 1st
    expect(result.startDate!.endsWith('01-01')).toBe(true);

    // Verify end date is December 31st
    expect(result.endDate!.endsWith('12-31')).toBe(true);

    // Verify start date is before end date
    expect(new Date(result.startDate!).getTime()).toBeLessThan(new Date(result.endDate!).getTime());
  });

  it('returns custom preset with no dates', () => {
    const result = getPeriodRange('custom');
    expect(result.preset).toBe('custom');
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });

  it('handles unknown presets by defaulting to all-time', () => {
    const result = getPeriodRange('unknown' as PeriodPreset);
    expect(result.preset).toBe('all-time');
  });

  it('different periods return different date ranges', () => {
    const last7Days = getPeriodRange('last-7-days');
    const last30Days = getPeriodRange('last-30-days');
    const thisYear = getPeriodRange('this-year');

    expect(last7Days.startDate).not.toBe(last30Days.startDate);
    expect(last30Days.startDate).not.toBe(thisYear.startDate);
  });
});

describe('parsePeriodFromParams', () => {
  it('parses all-time preset from params', () => {
    const params = new URLSearchParams('period=all-time');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('all-time');
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });

  it('parses last-7-days preset from params', () => {
    const params = new URLSearchParams('period=last-7-days');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('last-7-days');
  });

  it('parses last-30-days preset from params', () => {
    const params = new URLSearchParams('period=last-30-days');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('last-30-days');
  });

  it('parses this-month preset from params', () => {
    const params = new URLSearchParams('period=this-month');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('this-month');
  });

  it('parses this-quarter preset from params', () => {
    const params = new URLSearchParams('period=this-quarter');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('this-quarter');
  });

  it('parses this-year preset from params', () => {
    const params = new URLSearchParams('period=this-year');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('this-year');
  });

  it('parses custom preset from params', () => {
    const params = new URLSearchParams('period=custom');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('custom');
  });

  it('includes startDate and endDate when present', () => {
    const params = new URLSearchParams('period=custom&startDate=2024-01-01&endDate=2024-12-31');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('custom');
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2024-12-31');
  });

  it('handles startDate without endDate', () => {
    const params = new URLSearchParams('period=custom&startDate=2024-01-01');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('custom');
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBeUndefined();
  });

  it('handles endDate without startDate', () => {
    const params = new URLSearchParams('period=custom&endDate=2024-12-31');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('custom');
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBe('2024-12-31');
  });

  it('handles empty string period parameter', () => {
    const params = new URLSearchParams('period=');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('all-time');
  });

  it('handles missing period parameter', () => {
    const params = new URLSearchParams();
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('all-time');
  });

  it('handles invalid period parameter', () => {
    const params = new URLSearchParams('period=invalid-preset');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('all-time');
  });

  it('includes dates when preset is not custom', () => {
    const params = new URLSearchParams('period=this-month&startDate=2024-01-01&endDate=2024-12-31');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('this-month');
    // The function should still parse these even for non-custom presets
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2024-12-31');
  });

  it('handles multiple parameters', () => {
    const params = new URLSearchParams('period=last-7-days&otherParam=value&startDate=2024-01-01');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('last-7-days');
    expect(result.startDate).toBe('2024-01-01');
  });

  it('decodes URL-encoded parameters', () => {
    const params = new URLSearchParams('period=custom&startDate=2024-01-01&endDate=2024-12-31');
    const result = parsePeriodFromParams(params);
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2024-12-31');
  });

  it('handles case-sensitive period values', () => {
    const params = new URLSearchParams('period=All-Time');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('all-time');
  });
});

describe('parsePeriodFromParams - Edge cases', () => {
  it('handles whitespace in dates', () => {
    const params = new URLSearchParams('period=custom&startDate= 2024-01-01 &endDate= 2024-12-31 ');
    const result = parsePeriodFromParams(params);
    expect(result.startDate).toContain('2024-01-01');
    expect(result.endDate).toContain('2024-12-31');
  });

  it('handles empty date strings', () => {
    const params = new URLSearchParams('period=custom&startDate=&endDate=');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('custom');
    // Empty strings become empty strings, not undefined
    expect(result.startDate).toBe('');
    expect(result.endDate).toBe('');
  });

  it('handles special characters in dates (should be rejected by date parsing)', () => {
    const params = new URLSearchParams('period=custom&startDate=invalid&endDate=date');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('custom');
    expect(result.startDate).toBe('invalid');
    expect(result.endDate).toBe('date');
  });

  it('handles very long date strings', () => {
    const params = new URLSearchParams('period=custom&startDate=2024-01-01T00:00:00.000Z&endDate=2024-12-31T23:59:59.999Z');
    const result = parsePeriodFromParams(params);
    expect(result.preset).toBe('custom');
    expect(result.startDate).toBe('2024-01-01T00:00:00.000Z');
    expect(result.endDate).toBe('2024-12-31T23:59:59.999Z');
  });
});

describe('Period Range Validation', () => {
  it('validates that period presets are from the allowed list', () => {
    const allowedPresets = ['all-time', 'last-7-days', 'last-30-days', 'this-month', 'this-quarter', 'this-year', 'custom'];

    allowedPresets.forEach(preset => {
      const result = getPeriodRange(preset as PeriodPreset);
      expect(result.preset).toBe(preset);
    });
  });

  it('presets with date ranges return valid date formats', () => {
    const presetsWithDates = ['last-7-days', 'last-30-days', 'this-month', 'this-quarter', 'this-year'];

    presetsWithDates.forEach(preset => {
      const result = getPeriodRange(preset as PeriodPreset);
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('all-time and custom presets return undefined dates', () => {
    const presetsWithoutDates = ['all-time', 'custom'];

    presetsWithoutDates.forEach(preset => {
      const result = getPeriodRange(preset as PeriodPreset);
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });
  });
});
