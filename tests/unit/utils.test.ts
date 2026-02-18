import { describe, it, expect } from 'vitest';
import { cn, formatDate } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('joins multiple class names with spaces', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', null, 'bar', undefined, 'baz', false)).toBe('foo bar baz');
  });

  it('handles empty strings', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('handles zero as falsy', () => {
    expect(cn('foo', 0, 'bar')).toBe('foo bar');
  });

  it('returns empty string for all falsy values', () => {
    expect(cn(null, undefined, false, '')).toBe('');
  });

  it('handles single class name', () => {
    expect(cn('single-class')).toBe('single-class');
  });

  it('handles conditional class patterns', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });
});

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats date string correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('returns "Never" for null input', () => {
    expect(formatDate(null)).toBe('Never');
  });

  it('returns "Never" for undefined input', () => {
    expect(formatDate(undefined)).toBe('Never');
  });

  it('handles different date formats', () => {
    const date = new Date('2024-12-25T12:30:00Z');
    const result = formatDate(date);
    expect(result).toContain('25');
    expect(result).toContain('2024');
  });

  it('uses Spanish (es-AR) locale formatting', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    // Spanish locale uses full format like "15 de mar de 2024"
    expect(result).toMatch(/\d{2}\s+de\s+[a-z]{3}\s+de\s+\d{4}/i);
  });

  it('handles leap years', () => {
    const date = new Date('2024-02-29');
    const result = formatDate(date);
    expect(result).toContain('29');
    expect(result).toContain('2024');
  });

  it('handles end of year dates', () => {
    const date = new Date('2024-12-31');
    const result = formatDate(date);
    expect(result).toContain('31');
    expect(result).toContain('dic'); // December abbreviation in Spanish
    expect(result).toContain('2024');
  });

  it('handles start of year dates', () => {
    const date = new Date('2024-01-01');
    const result = formatDate(date);
    expect(result).toContain('01');
    expect(result).toContain('ene'); // January abbreviation in Spanish
    expect(result).toContain('2024');
  });

  it('handles dates with time components', () => {
    const date = new Date('2024-06-15T14:30:00.000Z');
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('2024');
    // Should not include time in the formatted output
    expect(result).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});
