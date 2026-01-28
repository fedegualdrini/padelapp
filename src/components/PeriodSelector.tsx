'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

type PeriodPreset =
  | 'all-time'
  | 'last-7-days'
  | 'last-30-days'
  | 'this-month'
  | 'this-quarter'
  | 'this-year'
  | 'custom';

interface PeriodSelectorProps {
  label?: string;
}

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

export default function PeriodSelector({ label = 'Periodo' }: PeriodSelectorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const period = parsePeriodFromParams(searchParams);
  const { startDate, endDate } = period.preset === 'custom' ? period : getPeriodRange(period.preset);

  const presetLabels: Record<PeriodPreset, string> = {
    'all-time': 'Todo el tiempo',
    'last-7-days': 'Últimos 7 días',
    'last-30-days': 'Últimos 30 días',
    'this-month': 'Este mes',
    'this-quarter': 'Este trimestre',
    'this-year': 'Este año',
    'custom': 'Personalizado',
  };

  const updatePeriod = (preset: PeriodPreset, start?: string, end?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', preset);

    if (start) params.set('startDate', start);
    else params.delete('startDate');

    if (end) params.set('endDate', end);
    else params.delete('endDate');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as PeriodPreset;
    if (preset === 'custom') {
      setIsCustomOpen(true);
    } else {
      setIsCustomOpen(false);
      updatePeriod(preset);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      updatePeriod('custom', customStart, customEnd);
      setIsCustomOpen(false);
    }
  };

  const formatRange = () => {
    if (period.preset === 'all-time') return presetLabels['all-time'];
    if (!startDate || !endDate) return presetLabels[period.preset];
    return `${new Date(startDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} - ${new Date(endDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          {label}
        </label>
      )}
      <select
        value={period.preset}
        onChange={handlePresetChange}
        className="rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <option value="all-time">{presetLabels['all-time']}</option>
        <option value="last-7-days">{presetLabels['last-7-days']}</option>
        <option value="last-30-days">{presetLabels['last-30-days']}</option>
        <option value="this-month">{presetLabels['this-month']}</option>
        <option value="this-quarter">{presetLabels['this-quarter']}</option>
        <option value="this-year">{presetLabels['this-year']}</option>
        <option value="custom">{presetLabels['custom']}</option>
      </select>

      {isCustomOpen && (
        <div className="mt-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-3">
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Desde</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-2 py-1 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Hasta</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-2 py-1 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)]/90"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {period.preset !== 'all-time' && !isCustomOpen && startDate && endDate && (
        <p className="text-xs text-[var(--muted)]">{formatRange()}</p>
      )}
    </div>
  );
}
