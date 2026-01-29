"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ComparePlayersDialogProps = {
  players: Array<{ id: string; name: string }>;
  groupSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function ComparePlayersDialog({
  players,
  groupSlug,
  isOpen,
  onClose,
}: ComparePlayersDialogProps) {
  const router = useRouter();
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [error, setError] = useState("");

  const handleCompare = () => {
    setError("");

    if (!player1Id || !player2Id) {
      setError("Por favor seleccioná dos jugadores");
      return;
    }

    if (player1Id === player2Id) {
      setError("Por favor seleccioná dos jugadores diferentes");
      return;
    }

    // Navigate to compare page using playerA and playerB params (matching existing implementation)
    router.push(
      `/g/${groupSlug}/players/compare?playerA=${player1Id}&playerB=${player2Id}`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="font-display text-xl text-[var(--ink)]">
            Comparar jugadores
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Seleccioná dos jugadores para ver su historial de enfrentamientos
          </p>
        </div>

        <div className="space-y-4">
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Jugador 1
            <select
              value={player1Id}
              onChange={(e) => {
                setPlayer1Id(e.target.value);
                setError("");
              }}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="">Elegir jugador</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Jugador 2
            <select
              value={player2Id}
              onChange={(e) => {
                setPlayer2Id(e.target.value);
                setError("");
              }}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="">Elegir jugador</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-[color:var(--card-border)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[color:var(--card-border-strong)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleCompare}
            className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90"
          >
            Comparar
          </button>
        </div>
      </div>
    </div>
  );
}
