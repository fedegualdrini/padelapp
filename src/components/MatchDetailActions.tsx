'use client';

import { useState } from 'react';
import ShareMatchCard, { ShareButton } from './ShareMatchCard';

type EloDelta = {
  playerId: string;
  name: string;
  previous: number;
  current: number;
  delta: number;
};

type MatchTeam = {
  name: string;
  sets: number[];
  opponentSets: number[];
};

type MatchDetailActionsProps = {
  matchId: string;
  slug: string;
  playedAt: string;
  bestOf: number;
  teams: readonly MatchTeam[];
  eloDeltas: EloDelta[];
  winner?: string;
};

export default function MatchDetailActions({
  matchId,
  slug,
  playedAt,
  bestOf,
  teams,
  eloDeltas,
  winner,
}: MatchDetailActionsProps) {
  const [showShareCard, setShowShareCard] = useState(false);

  // Transform teams to include winner status
  const teamsWithWinner = teams.map((team) => ({
    ...team,
    isWinner: team.name === winner,
  })) as Array<{ name: string; sets: number[]; opponentSets: number[]; isWinner: boolean }>;

  return (
    <>
      <ShareButton onClick={() => setShowShareCard(true)} />

      {showShareCard && (
        <ShareMatchCard
          matchId={matchId}
          slug={slug}
          playedAt={playedAt}
          bestOf={bestOf}
          teams={teamsWithWinner}
          eloDeltas={eloDeltas}
          winner={winner}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </>
  );
}
