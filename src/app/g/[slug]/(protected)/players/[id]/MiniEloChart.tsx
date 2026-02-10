"use client";

import { useEffect, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  LineSeries,
  type IChartApi,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";

type EloPoint = { date: string; rating: number };

interface MiniEloChartProps {
  data: EloPoint[];
}

export default function MiniEloChart({ data }: MiniEloChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  // Get CSS variables for theme
  const themeColors = useMemo(() => {
    if (typeof window === "undefined") return null;

    const style = getComputedStyle(document.documentElement);
    return {
      background: style.getPropertyValue("--chart-bg").trim(),
      grid: style.getPropertyValue("--chart-grid").trim(),
      textPrimary: style.getPropertyValue("--chart-text-primary").trim(),
      textSecondary: style.getPropertyValue("--chart-text-secondary").trim(),
      accent: style.getPropertyValue("--accent").trim() || "#0d6b5f",
    };
  }, [isDark]);

  // Transform data for Lightweight Charts
  const lineData: LineData[] = useMemo(() => {
    return data
      .map((point) => ({
        time: Math.floor(new Date(point.date).getTime() / 1000) as UTCTimestamp,
        value: point.rating,
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));
  }, [data]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !themeColors) return;

    // Clear any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: themeColors.background },
        textColor: themeColors.textPrimary,
      },
      grid: {
        vertLines: { color: themeColors.grid, style: LineStyle.Solid },
        horzLines: { color: themeColors.grid, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: themeColors.textSecondary,
          style: LineStyle.Solid,
          labelBackgroundColor: themeColors.textPrimary,
        },
        horzLine: {
          width: 1,
          color: themeColors.textSecondary,
          style: LineStyle.Solid,
          labelBackgroundColor: themeColors.textPrimary,
        },
      },
      rightPriceScale: {
        borderColor: themeColors.grid,
      },
      timeScale: {
        borderColor: themeColors.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 250,
    });

    chartRef.current = chart;

    // Add series
    if (lineData.length > 0) {
      const series = chart.addSeries(LineSeries, {
        color: themeColors.accent,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      series.setData(lineData);
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [themeColors, lineData]);

  if (lineData.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)]">
        <p className="text-sm text-[var(--muted)]">Sin datos de ELO</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
