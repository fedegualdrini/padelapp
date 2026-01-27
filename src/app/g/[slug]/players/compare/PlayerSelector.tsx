"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PlayerSelectorProps = {
  players: Array<{ id: string; name: string }>;
  slug: string;
  playerA?: string;
  playerB?: string;
};

export default function PlayerSelector({
  players,
  slug,
  playerA,
  playerB,
}: PlayerSelectorProps) {
  const router = useRouter();
  const [selectedPlayerA, setSelectedPlayerA] = useState(playerA || "");
  const [selectedPlayerB, setSelectedPlayerB] = useState(playerB || "");

  const handlePlayerAChange = (value: string) => {
    setSelectedPlayerA(value);
    // Use `value` + current selectedPlayerB to avoid stale state during the same tick.
    if (value && selectedPlayerB && value !== selectedPlayerB) {
      router.push(
        `/g/${slug}/players/compare?playerA=${value}&playerB=${selectedPlayerB}`
      );
    }
  };

  const handlePlayerBChange = (value: string) => {
    setSelectedPlayerB(value);
    // Use `value` + current selectedPlayerA to avoid stale state during the same tick.
    if (selectedPlayerA && value && selectedPlayerA !== value) {
      router.push(
        `/g/${slug}/players/compare?playerA=${selectedPlayerA}&playerB=${value}`
      );
    }
  };

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        Jugador A
        <select
          name="playerA"
          value={selectedPlayerA}
          className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
          onChange={(e) => handlePlayerAChange(e.target.value)}
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
        Jugador B
        <select
          name="playerB"
          value={selectedPlayerB}
          className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
          onChange={(e) => handlePlayerBChange(e.target.value)}
        >
          <option value="">Elegir jugador</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
