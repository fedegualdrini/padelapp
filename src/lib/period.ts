// Pure utility functions for period parsing - can be used in both server and client components

export type PeriodPreset =
  | 'all-time'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-month'
  | 'this-quarter'
  | 'this-year'
  | 'custom';

export interface PeriodRange {
  preset: PeriodPreset;
  startDate?: string;
  endDate?: string;
}

export function getPeriodRange(preset: PeriodPreset): PeriodRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'all-time':
      return { preset: 'all-time' };

    case 'last-7-days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        preset: 'last-7-days',
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };

    case 'last-30-days':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        preset: 'last-30-days',
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };

    case 'this-month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        preset: 'this-month',
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
      };

    case 'this-quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      return {
        preset: 'this-quarter',
        startDate: startOfQuarter.toISOString().split('T')[0],
        endDate: endOfQuarter.toISOString().split('T')[0],
      };

    case 'this-year':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      return {
        preset: 'this-year',
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0],
      };

    case 'custom':
      return { preset: 'custom' };

    default:
      return { preset: 'all-time' };
  }
}

export function parsePeriodFromParams(searchParams: URLSearchParams): PeriodRange {
  const period = searchParams.get('period') as PeriodPreset | null;

  if (period && ['all-time', 'last-7-days', 'last-30-days', 'this-month', 'this-quarter', 'this-year', 'custom'].includes(period)) {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    return {
      preset: period,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    };
  }

  return { preset: 'all-time' };
}
