"use client";

import { useState } from "react";
import type { PlayerWithElo, SuggestedTeams } from "@/lib/data";
import { createMatchFromOccurrence } from "./actions";

type TeamSuggestionModalProps = {
  occurrenceId: string;
  slug: string;
  initialTeams: SuggestedTeams;
  onClose: () => void;
  onSuccess: (matchId: string) => void;
  onError: (error: string) => void;
  createdBy: string;
};

export default function TeamSuggestionModal({
  occurrenceId,
  slug,
  initialTeams,
  onClose,
  onSuccess,
  onError,
  createdBy,
}: TeamSuggestionModalProps) {
  const [teams, setTeams] = useState<{ teamA: PlayerWithElo[]; teamB: PlayerWithElo[] }>({
    teamA: [...initialTeams.teamA],
    teamB: [...initialTeams.teamB],
  });
  const [loading, setLoading] = useState(false);

  const handlePlayerClick = (player: PlayerWithElo, team: "A" | "B") => {
    setTeams((prev) => {
      if (team === "A") {
        return {
          ...prev,
          teamA: prev.teamA.filter((p) => p.id !== player.id),
          teamB: prev.teamB.length < 2 ? [...prev.teamB, player] : prev.teamB,
        };
      } else {
        return {
          ...prev,
          teamB: prev.teamB.filter((p) => p.id !== player.id),
          teamA: prev.teamA.length < 2 ? [...prev.teamA, player] : prev.teamA,
        };
      }
    });
  };

  const teamAElo = teams.teamA.reduce((sum, p) => sum + p.elo, 0);
  const teamBElo = teams.teamB.reduce((sum, p) => sum + p.elo, 0);
  const canCreate = teams.teamA.length === 2 && teams.teamB.length === 2;

  const handleConfirm = async () => {
    if (!canCreate) return;

    setLoading(true);
    onError("");

    try {
      const result = await createMatchFromOccurrence(
        slug,
        occurrenceId,
        teams.teamA.map((p) => p.id),
        teams.teamB.map((p) => p.id),
        createdBy
      );
      onSuccess(result.matchId);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error creando el partido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-[var(--ink)]">Equipos sugeridos</h3>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--ink)]"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-[var(--muted)]">
          Hacé clic en los jugadores para moverlos entre equipos. El equilibrio se basa en ELO.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Team A */}
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-[var(--ink)]">Equipo A</h4>
              <span className="text-sm font-medium text-[var(--accent)]">
                {teamAElo} ELO
              </span>
            </div>
            <div className="space-y-2">
              {teams.teamA.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player, "A")}
                  className="w-full rounded-lg border border-[color:var(--card-border)] px-3 py-2 text-left transition hover:border-[var(--accent)] hover:bg-[color:var(--accent)] hover:text-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm opacity-75">{player.elo}</span>
                  </div>
                </button>
              ))}
              {teams.teamA.length < 2 && (
                <div className="rounded-lg border border-dashed border-[color:var(--card-border)] px-3 py-2 text-center text-sm text-[var(--muted)]">
                  {teams.teamA.length === 0 ? "Vacio" : "Falta 1 jugador"}
                </div>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-[var(--ink)]">Equipo B</h4>
              <span className="text-sm font-medium text-[var(--accent)]">
                {teamBElo} ELO
              </span>
            </div>
            <div className="space-y-2">
              {teams.teamB.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player, "B")}
                  className="w-full rounded-lg border border-[color:var(--card-border)] px-3 py-2 text-left transition hover:border-[var(--accent)] hover:bg-[color:var(--accent)] hover:text-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm opacity-75">{player.elo}</span>
                  </div>
                </button>
              ))}
              {teams.teamB.length < 2 && (
                <div className="rounded-lg border border-dashed border-[color:var(--card-border)] px-3 py-2 text-center text-sm text-[var(--muted)]">
                  {teams.teamB.length === 0 ? "Vacio" : "Falta 1 jugador"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-[color:var(--card-border)] px-6 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[color:var(--card-border)] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !canCreate}
            className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando..." : "Confirmar y crear partido"}
          </button>
        </div>
      </div>
    </div>
  );
}
