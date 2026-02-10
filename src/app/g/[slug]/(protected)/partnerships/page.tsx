"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PartnershipCard from "@/components/PartnershipCard";
import type { Partnership, PartnershipsResponse } from "@/lib/partnership-types";

interface PartnershipsPageProps {
  params: Promise<{ slug: string }>;
}

export default function PartnershipsPage({ params }: PartnershipsPageProps) {
  const [slug, setSlug] = useState<string>("");
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros / orden
  const [minMatches, setMinMatches] = useState(3);
  const [sortBy, setSortBy] = useState("win_rate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [playerFilter, setPlayerFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const searchParams = useSearchParams();

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    const playerIdFromUrl = searchParams.get("player_id");
    if (playerIdFromUrl) setPlayerFilter(playerIdFromUrl);
  }, [searchParams]);

  const fetchPartnerships = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        min_matches: minMatches.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (playerFilter) queryParams.set("player_id", playerFilter);

      const response = await fetch(`/api/partnerships?${queryParams.toString()}`);
      if (!response.ok) throw new Error("No se pudieron cargar las parejas");

      const result: PartnershipsResponse = await response.json();
      setPartnerships(result.partnerships);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }, [slug, minMatches, sortBy, sortOrder, playerFilter, offset]);

  useEffect(() => {
    fetchPartnerships();
  }, [fetchPartnerships]);

  const handleResetFilters = () => {
    setMinMatches(3);
    setSortBy("win_rate");
    setSortOrder("desc");
    setPlayerFilter("");
    setOffset(0);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (!slug) {
    return (
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-1/3 rounded bg-[color:var(--card-border)]/30" />
          <div className="h-40 rounded bg-[color:var(--card-border)]/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-2xl text-[var(--ink)]">Parejas</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Mirá qué combinaciones rinden mejor según partidos jugados, porcentaje de victorias y delta de ELO.
        </p>
      </header>

      {/* Filtros */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1 text-sm font-semibold text-[var(--ink)]">
            Mínimo de partidos
            <select
              value={minMatches}
              onChange={(e) => {
                setMinMatches(parseInt(e.target.value));
                setOffset(0);
              }}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value={3}>3+</option>
              <option value={5}>5+</option>
              <option value={10}>10+</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-semibold text-[var(--ink)]">
            Ordenar por
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setOffset(0);
              }}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="win_rate">% victorias</option>
              <option value="matches_played">Partidos</option>
              <option value="elo_change_delta">Delta ELO</option>
              <option value="last_played_together">Último partido</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5"
          >
            {sortOrder === "desc" ? "↓ Descendente" : "↑ Ascendente"}
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-full bg-transparent px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            Reiniciar
          </button>
        </div>

        {playerFilter && (
          <div className="mt-4 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-3 text-sm">
            <span className="text-[var(--muted)]">Filtrando por jugador:</span>{" "}
            <span className="font-semibold text-[var(--ink)]">{playerFilter}</span>
            <button
              type="button"
              onClick={() => {
                setPlayerFilter("");
                setOffset(0);
              }}
              className="ml-3 text-sm font-semibold text-[var(--accent)]"
            >
              Limpiar
            </button>
          </div>
        )}
      </section>

      {/* Resultados */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4"
            >
              <div className="mb-3 h-16 rounded bg-[color:var(--card-border)]/30" />
              <div className="h-8 rounded bg-[color:var(--card-border)]/30" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={fetchPartnerships}
            className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      ) : partnerships.length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <p className="text-sm text-[var(--muted)]">No se encontraron parejas con estos filtros.</p>
          <p className="mt-2 text-xs text-[var(--muted)]">Probá bajar el mínimo de partidos o sacar el filtro.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partnerships.map((partnership) => (
              <PartnershipCard
                key={`${partnership.player1_id}-${partnership.player2_id}`}
                partnership={partnership}
                groupSlug={slug}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={currentPage === 1}
                className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-5 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="text-sm text-[var(--muted)]">
                Página {currentPage} de {totalPages} · {total} parejas
              </span>

              <button
                type="button"
                onClick={() => setOffset(Math.min((totalPages - 1) * limit, offset + limit))}
                disabled={currentPage >= totalPages}
                className="rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-5 py-2 text-sm font-semibold text-[var(--ink)] disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
