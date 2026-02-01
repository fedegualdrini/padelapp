"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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

  // FIX: Use functional updates to avoid stale state
  const handlePlayerAChange = useCallback((value: string) => {
    setSelectedPlayerA(value);
    
    // Read current state using functional update pattern
    setSelectedPlayerB((currentB) => {
      if (value && currentB && value !== currentB) {
        router.push(
          `/g/${slug}/players/compare?playerA=${value}&playerB=${currentB}`
        );
      }
      return currentB;
    });
  }, [slug, router]);

  const handlePlayerBChange = useCallback((value: string) => {
    setSelectedPlayerB(value);
    
    // Read current state using functional update pattern  
    setSelectedPlayerA((currentA) => {
      if (currentA && value && currentA !== value) {
        router.push(
          `/g/${slug}/players/compare?playerA=${currentA}&playerB=${value}`
        );
      }
      return currentA;
    });
  }, [slug, router]);

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
