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
  type ISeriesApi,
  type LineData,
} from "lightweight-charts";

type EloTimelinePoint = { date: string; rating: number };
type EloTimelineSeries = {
  playerId: string;
  name: string;
  status: string;
  points: EloTimelinePoint[];
};

interface TradingViewChartProps {
  data: EloTimelineSeries[];
  hiddenPlayers?: Set<string>;
  focusedPlayer?: string | null;
  onSeriesHover?: (playerId: string | null) => void;
}

const USUAL_COLORS = [
  "#0d6b5f",
  "#15803d",
  "#0ea5a4",
  "#1f8a70",
  "#22c55e",
  "#14b8a6",
];

const INVITE_COLORS = [
  "#b45309",
  "#d97706",
  "#f59e0b",
  "#c2410c",
  "#ea580c",
  "#a16207",
];

export function TradingViewChart({
  data,
  hiddenPlayers = new Set(),
  focusedPlayer = null,
  onSeriesHover,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesMapRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
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
    };
  }, [isDark]);

  // Transform data for Lightweight Charts
  const transformedData = useMemo(() => {
    return data.map((series, index) => {
      const colorArray = series.status === "usual" ? USUAL_COLORS : INVITE_COLORS;
      const color = colorArray[index % colorArray.length];

      const lineData: LineData[] = series.points
        .map((point) => ({
          time: Math.floor(new Date(point.date).getTime() / 1000) as any,
          value: point.rating,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number)); // Sort in ascending order

      return {
        playerId: series.playerId,
        name: series.name,
        status: series.status,
        color,
        data: lineData,
      };
    });
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
        textColor: themeColors.textPrimary,
      },
      timeScale: {
        borderColor: themeColors.grid,
        textColor: themeColors.textPrimary,
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    // Handle resize
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
      seriesMapRef.current.clear();
    };
  }, [themeColors]);

  // Update theme when it changes
  useEffect(() => {
    if (!chartRef.current || !themeColors) return;

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: themeColors.background },
        textColor: themeColors.textPrimary,
      },
      grid: {
        vertLines: { color: themeColors.grid },
        horzLines: { color: themeColors.grid },
      },
      rightPriceScale: {
        borderColor: themeColors.grid,
        textColor: themeColors.textPrimary,
      },
      timeScale: {
        borderColor: themeColors.grid,
        textColor: themeColors.textPrimary,
      },
    });
  }, [themeColors]);

  // Update series data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Clear existing series
    seriesMapRef.current.forEach((series) => {
      try {
        chart.removeSeries(series);
      } catch (e) {
        // Series might already be removed
      }
    });
    seriesMapRef.current.clear();

    // Add new series
    transformedData.forEach((seriesData) => {
      if (hiddenPlayers.has(seriesData.playerId)) return;
      if (seriesData.data.length === 0) return;

      try {
        const series = chart.addSeries(LineSeries, {
          color: seriesData.color,
          lineWidth: 2,
          title: seriesData.name,
          priceLineVisible: false,
          lastValueVisible: true,
        });

        // Apply opacity if not focused
        if (focusedPlayer && focusedPlayer !== seriesData.playerId) {
          series.applyOptions({
            color: seriesData.color + "33", // 20% opacity
          });
        }

        series.setData(seriesData.data);
        seriesMapRef.current.set(seriesData.playerId, series);
      } catch (e) {
        console.error("Error adding series:", e);
      }
    });

    // Fit content to view
    try {
      chart.timeScale().fitContent();
    } catch (e) {
      console.error("Error fitting content:", e);
    }
  }, [transformedData, hiddenPlayers, focusedPlayer]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
