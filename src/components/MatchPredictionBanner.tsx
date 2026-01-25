"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlayerElos } from "@/app/matches/new/prediction-actions";
import { calculateMatchPrediction } from "@/lib/elo-utils";

type MatchPredictionBannerProps = {
  groupId: string;
  team1PlayerIds: [string | null, string | null];
  team2PlayerIds: [string | null, string | null];
  team1Names: [string, string];
  team2Names: [string, string];
};

type EloState = {
  team1AvgElo: number;
  team2AvgElo: number;
} | null;

export default function MatchPredictionBanner({
  groupId,
  team1PlayerIds,
  team2PlayerIds,
  team1Names,
  team2Names,
}: MatchPredictionBannerProps) {
  const hasAllPlayers =
    Boolean(team1PlayerIds[0]) &&
    Boolean(team1PlayerIds[1]) &&
    Boolean(team2PlayerIds[0]) &&
    Boolean(team2PlayerIds[1]);

  const [eloState, setEloState] = useState<EloState>(null);

  const playerKey = useMemo(() => {
    // Stable key so the effect only runs when the ids *change*
    return [
      groupId,
      team1PlayerIds[0],
      team1PlayerIds[1],
      team2PlayerIds[0],
      team2PlayerIds[1],
    ].join(":");
  }, [groupId, team1PlayerIds, team2PlayerIds]);

  useEffect(() => {
    if (!hasAllPlayers) return;

    let cancelled = false;

    const allPlayerIds = [
      team1PlayerIds[0]!,
      team1PlayerIds[1]!,
      team2PlayerIds[0]!,
      team2PlayerIds[1]!,
    ];

    getPlayerElos(groupId, allPlayerIds)
      .then((elos) => {
        if (cancelled) return;

        const team1Elo1 = elos[team1PlayerIds[0]!] ?? 1000;
        const team1Elo2 = elos[team1PlayerIds[1]!] ?? 1000;
        const team2Elo1 = elos[team2PlayerIds[0]!] ?? 1000;
        const team2Elo2 = elos[team2PlayerIds[1]!] ?? 1000;

        const avgTeam1 = (team1Elo1 + team1Elo2) / 2;
        const avgTeam2 = (team2Elo1 + team2Elo2) / 2;

        setEloState({
          team1AvgElo: Math.round(avgTeam1),
          team2AvgElo: Math.round(avgTeam2),
        });
      })
      .catch(() => {
        // Keep the banner hidden on errors.
        if (cancelled) return;
        setEloState(null);
      });

    return () => {
      cancelled = true;
    };
  }, [playerKey, hasAllPlayers, groupId, team1PlayerIds, team2PlayerIds]);

  if (!hasAllPlayers || !eloState) {
    return null;
  }

  const prediction = calculateMatchPrediction(
    eloState.team1AvgElo,
    eloState.team2AvgElo
  );

  const team1Percent = Math.round(prediction.team1WinProb * 100);
  const team2Percent = Math.round(prediction.team2WinProb * 100);

  const getConfidenceText = () => {
    switch (prediction.confidence) {
      case "high":
        return "Alta confianza";
      case "low":
        return "Baja confianza";
      default:
        return "Confianza media";
    }
  };

  return (
    <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Predicción
        </p>
        <p className="text-xs text-[var(--muted)]">{getConfidenceText()}</p>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Team 1 */}
        <div className="text-right">
          <p
            className={`text-sm font-medium ${
              prediction.predictedWinner === 1
                ? "text-[var(--accent)]"
                : "text-[var(--muted)]"
            }`}
          >
            {team1Names[0]} / {team1Names[1]}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            ELO promedio: {eloState.team1AvgElo}
          </p>
          <p
            className={`mt-1 text-lg font-semibold ${
              prediction.predictedWinner === 1
                ? "text-[var(--accent)]"
                : "text-[var(--ink)]"
            }`}
          >
            {team1Percent}%
          </p>
        </div>

        {/* VS */}
        <div className="px-2">
          <p className="text-lg font-semibold text-[var(--muted)]">vs</p>
        </div>

        {/* Team 2 */}
        <div className="text-left">
          <p
            className={`text-sm font-medium ${
              prediction.predictedWinner === 2
                ? "text-[var(--gold)]"
                : "text-[var(--muted)]"
            }`}
          >
            {team2Names[0]} / {team2Names[1]}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            ELO promedio: {eloState.team2AvgElo}
          </p>
          <p
            className={`mt-1 text-lg font-semibold ${
              prediction.predictedWinner === 2
                ? "text-[var(--gold)]"
                : "text-[var(--ink)]"
            }`}
          >
            {team2Percent}%
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-[var(--muted)]">
        Basado en ratings ELO actuales
      </p>
    </div>
  );
}
