"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PartnershipDetail } from "@/lib/partnership-types";

interface PartnershipDetailPageProps {
  params: Promise<{ slug: string; player1Id: string; player2Id: string }>;
}

function InitialBadge({ name }: { name: string }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-solid)] text-xl font-semibold text-[var(--ink)]">
      {initial}
    </div>
  );
}

export default function PartnershipDetailPage({ params }: PartnershipDetailPageProps) {
  const [data, setData] = useState<PartnershipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setPlayer1Id(p.player1Id);
      setPlayer2Id(p.player2Id);
    });
  }, [params]);

  useEffect(() => {
    if (!player1Id || !player2Id) return;

    async function fetchPartnership() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/partnerships/${player1Id}/${player2Id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("No hay datos suficientes para esta pareja.");
            return;
          }
          throw new Error("No se pudieron cargar los detalles");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error");
      } finally {
        setLoading(false);
      }
    }

    fetchPartnership();
  }, [player1Id, player2Id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-1/3 rounded bg-[color:var(--card-border)]/30" />
          <div className="h-40 rounded bg-[color:var(--card-border)]/30" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href={slug ? `/g/${slug}/partnerships` : "/"}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a parejas
        </Link>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { player1, player2, partnership, match_history } = data;
  const winRatePercent = Math.round(partnership.win_rate * 100);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/g/${slug}/partnerships`}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a parejas
      </Link>

      <header className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <InitialBadge name={player1.name} />
            <span className="text-sm font-semibold text-[var(--muted)]">+</span>
            <InitialBadge name={player2.name} />
          </div>
          <div>
            <h2 className="font-display text-2xl text-[var(--ink)]">{player1.name} · {player2.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Estadísticas de la pareja</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 text-center">
          <p className="text-3xl font-semibold text-[var(--ink)]">{partnership.matches_played}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Partidos juntos</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 text-center">
          <p className="text-3xl font-semibold text-[var(--accent)]">{winRatePercent}%</p>
          <p className="mt-1 text-sm text-[var(--muted)]">% victorias</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 text-center">
          <p className="text-3xl font-semibold text-[var(--ink)]">{partnership.wins}-{partnership.losses}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Ganados - Perdidos</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 text-center">
          <p className="text-3xl font-semibold text-[var(--ink)]">{partnership.synergy_score.toFixed(2)}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Sinergia</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-xl text-[var(--ink)]">Historial</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Los últimos partidos que jugaron juntos.</p>

        {match_history.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">Todavía no hay historial disponible.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {match_history.map((match) => (
              <div
                key={match.match_id}
                className={
                  "rounded-2xl border border-[color:var(--card-border)] p-4 " +
                  (match.result === "win"
                    ? "bg-emerald-500/10"
                    : "bg-red-500/10")
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      vs {match.opponent_team_players?.map((p) => p.name).join(" y ") || "Rivales"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(match.played_at).toLocaleDateString("es-AR", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--ink)]">{match.score_summary}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {match.elo_change_player1 >= 0 ? "+" : ""}
                      {match.elo_change_player1.toFixed(1)} / {match.elo_change_player2 >= 0 ? "+" : ""}
                      {match.elo_change_player2.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
