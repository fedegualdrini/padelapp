"use client";

import dynamic from "next/dynamic";

// Dynamic import for chart component to reduce initial bundle size
// Must be in a client component to use ssr: false
const MiniEloChart = dynamic(() => import("./MiniEloChart"), {
  loading: () => (
    <div className="flex h-[250px] items-center justify-center rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)]">
      <p className="text-sm text-[var(--muted)]">Cargando gráfico...</p>
    </div>
  ),
  ssr: false, // Chart uses browser APIs
});

type EloPoint = { date: string; rating: number };

interface MiniEloChartWrapperProps {
  data: EloPoint[];
}

export default function MiniEloChartWrapper({ data }: MiniEloChartWrapperProps) {
  return <MiniEloChart data={data} />;
}
