"use client";

import { useEffect, useState } from "react";
import { getPlayerElos } from "@/app/matches/new/prediction-actions";
import { calculateMatchPrediction } from "@/lib/elo-utils";

type MatchPredictionBannerProps = {
  groupId: string;
  team1PlayerIds: [string | null, string | null];
  team2PlayerIds: [string | null, string | null];
  team1Names: [string, string];
  team2Names: [string, string];
};

export default function MatchPredictionBanner({
  groupId,
  team1PlayerIds,
  team2PlayerIds,
  team1Names,
  team2Names,
}: MatchPredictionBannerProps) {
  const [prediction, setPrediction] = useState<ReturnType<
    typeof calculateMatchPrediction
  > | null>(null);
  const [team1AvgElo, setTeam1AvgElo] = useState<number | null>(null);
  const [team2AvgElo, setTeam2AvgElo] = useState<number | null>(null);

  useEffect(() => {
    // Check if all 4 players are selected
    if (
      !team1PlayerIds[0] ||
      !team1PlayerIds[1] ||
      !team2PlayerIds[0] ||
      !team2PlayerIds[1]
    ) {
      setPrediction(null);
      setTeam1AvgElo(null);
      setTeam2AvgElo(null);
      return;
    }

    const allPlayerIds = [
      team1PlayerIds[0],
      team1PlayerIds[1],
      team2PlayerIds[0],
      team2PlayerIds[1],
    ];

    // Fetch ELOs and calculate prediction
    getPlayerElos(groupId, allPlayerIds).then((elos) => {
      const team1Elo1 = elos[team1PlayerIds[0]!] ?? 1000;
      const team1Elo2 = elos[team1PlayerIds[1]!] ?? 1000;
      const team2Elo1 = elos[team2PlayerIds[0]!] ?? 1000;
      const team2Elo2 = elos[team2PlayerIds[1]!] ?? 1000;

      const avgTeam1 = (team1Elo1 + team1Elo2) / 2;
      const avgTeam2 = (team2Elo1 + team2Elo2) / 2;

      setTeam1AvgElo(Math.round(avgTeam1));
      setTeam2AvgElo(Math.round(avgTeam2));

      const pred = calculateMatchPrediction(avgTeam1, avgTeam2);
      setPrediction(pred);
    });
  }, [groupId, team1PlayerIds, team2PlayerIds]);

  if (!prediction || team1AvgElo === null || team2AvgElo === null) {
    return null;
  }

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
            ELO promedio: {team1AvgElo}
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
            ELO promedio: {team2AvgElo}
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
