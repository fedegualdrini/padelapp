import { describe, it, expect } from 'vitest';
import { cn, formatDate } from '@/lib/utils';

describe('General Utilities', () => {
  describe('cn (className utility)', () => {
    it('joins multiple class names with spaces', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('filters out falsy values', () => {
      const result = cn('class1', '', 'class2', null, 'class3', undefined, false, 0);
      expect(result).toBe('class1 class2 class3');
    });

    it('handles single class name', () => {
      expect(cn('single')).toBe('single');
    });

    it('returns empty string for no arguments', () => {
      expect(cn()).toBe('');
    });

    it('handles empty strings', () => {
      expect(cn('', '', '')).toBe('');
    });

    it('filters out null values', () => {
      const result = cn('class1', null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('filters out undefined values', () => {
      const result = cn('class1', undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('filters out false boolean', () => {
      const result = cn('class1', false, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('filters out zero (falsy number)', () => {
      const result = cn('class1', 0, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('includes truthy numbers', () => {
      const result = cn('class1', 1, 'class2');
      expect(result).toBe('class1 1 class2');
    });

    it('handles conditional class names', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn('base', isActive && 'active', isDisabled && 'disabled');
      expect(result).toBe('base active');
    });

    it('handles arrays of class names', () => {
      // TypeScript might complain, but the implementation uses spread
      const classes = ['class1', 'class2', 'class3'];
      const result = cn(...classes);
      expect(result).toBe('class1 class2 class3');
    });

    it('joins class names as-is without trimming', () => {
      const result = cn('  class1  ', '  class2  ');
      // Note: filter(Boolean) doesn't trim, so whitespace is preserved
      // '  class1  ' + ' ' + '  class2  ' = '  class1     class2  '
      expect(result).toBe('  class1     class2  ');
    });

    it('duplicates are kept (no deduplication)', () => {
      const result = cn('class1', 'class1', 'class2');
      expect(result).toBe('class1 class1 class2');
    });
  });

  describe('formatDate', () => {
    it('formats a date string correctly', () => {
      const result = formatDate('2025-01-15');
      // es-AR locale: 15 ene. 2025
      expect(result).toContain('15');
      expect(result).toContain('ene');
      expect(result).toContain('2025');
    });

    it('formats a Date object correctly', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toContain('15');
      expect(result).toContain('ene');
      expect(result).toContain('2025');
    });

    it('returns "Never" for null input', () => {
      expect(formatDate(null)).toBe('Never');
    });

    it('returns "Never" for undefined input', () => {
      expect(formatDate(undefined as any)).toBe('Never');
    });

    it('handles different months correctly', () => {
      expect(formatDate('2025-02-15')).toContain('feb');
      expect(formatDate('2025-03-15')).toContain('mar');
      expect(formatDate('2025-04-15')).toContain('abr');
      expect(formatDate('2025-05-15')).toContain('may');
      expect(formatDate('2025-06-15')).toContain('jun');
      expect(formatDate('2025-07-15')).toContain('jul');
      expect(formatDate('2025-08-15')).toContain('ago');
      expect(formatDate('2025-09-15')).toContain('sep');
      expect(formatDate('2025-10-15')).toContain('oct');
      expect(formatDate('2025-11-15')).toContain('nov');
      expect(formatDate('2025-12-15')).toContain('dic');
    });

    it('handles single-digit days with leading zero', () => {
      const result = formatDate('2025-01-05');
      expect(result).toContain('05');
      expect(result).toContain('ene');
    });

    it('handles different years', () => {
      expect(formatDate('2024-12-31')).toContain('2024');
      expect(formatDate('2025-01-01')).toContain('2025');
      expect(formatDate('2030-06-15')).toContain('2030');
    });

    it('handles ISO date strings with time component', () => {
      const result = formatDate('2025-01-15T10:30:00.000Z');
      expect(result).toContain('15');
      expect(result).toContain('ene');
      expect(result).toContain('2025');
    });

    it('handles edge case of month boundaries', () => {
      expect(formatDate('2025-02-28')).toContain('28');
      // 2025 is not a leap year, so Feb 29 is invalid
      // But JS Date will automatically roll it over to Mar 1
      const result = formatDate('2025-02-29');
      expect(result).toBeTruthy(); // Just verify it returns something

      // 2024 is a leap year, so Feb 29 should work
      expect(formatDate('2024-02-29')).toContain('29');
    });

    it('handles day 31 for months with 31 days', () => {
      expect(formatDate('2025-01-31')).toContain('31');
      expect(formatDate('2025-03-31')).toContain('31');
      expect(formatDate('2025-05-31')).toContain('31');
      expect(formatDate('2025-07-31')).toContain('31');
      expect(formatDate('2025-08-31')).toContain('31');
      expect(formatDate('2025-10-31')).toContain('31');
      expect(formatDate('2025-12-31')).toContain('31');
    });

    it('preserves locale formatting (es-AR)', () => {
      const result = formatDate('2025-01-15');
      // es-AR format: "DD de MMM de YYYY" with abbreviated month in Spanish
      const parts = result.split(' ');
      expect(parts).toHaveLength(5); // day, "de", month, "de", year
      expect(parts[0]).toMatch(/^\d{2}$/); // Day with leading zero
      expect(parts[1]).toBe('de'); // Spanish preposition
      expect(parts[2]).toMatch(/^[a-z]{3,4}$/); // Month abbreviation (3-4 chars)
      expect(parts[3]).toBe('de'); // Spanish preposition
      expect(parts[4]).toMatch(/^\d{4}$/); // Year
    });
  });
});
