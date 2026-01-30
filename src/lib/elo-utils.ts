// Client-side ELO utilities for match predictions

export type PredictionFactor = {
  name: string;
  value: string;
  weight: string;
  impact: "team1" | "team2" | "neutral";
};

export type PredictionResult = {
  team1WinProb: number;
  team2WinProb: number;
  predictedWinner: 1 | 2;
  confidence: "low" | "medium" | "high";
  factors: PredictionFactor[];
};

export type PredictionAccuracy = {
  overallAccuracy: number;
  accuracyByEloGap: { eloRange: string; accuracy: number; matches: number }[];
  biggestUpsets: { matchId: string; underdogTeam: string; winProb: number; date: string }[];
  trendOverTime: { date: string; accuracy: number }[];
};

function getConfidenceLevel(winProb: number): "low" | "medium" | "high" {
  if (winProb >= 0.70 && winProb <= 0.85) return "high";
  if ((winProb >= 0.55 && winProb <= 0.70) || (winProb >= 0.15 && winProb <= 0.30)) return "medium";
  return "low";
}

export function calculateMatchPrediction(
  team1AvgElo: number,
  team2AvgElo: number,
  options?: {
    team1Form?: number; // Win rate 0-1
    team2Form?: number;
    team1HeadToHead?: number; // Win rate 0-1 vs opponent
    team2HeadToHead?: number;
    team1Streak?: number; // Current streak (positive for wins, negative for losses)
    team2Streak?: number;
    team1PartnershipRate?: number; // Historical win rate together
    team2PartnershipRate?: number;
  }
): PredictionResult {
  // Calculate base ELO probabilities
  const team1WinProb = 1 / (1 + Math.pow(10, (team2AvgElo - team1AvgElo) / 400));
  const team2WinProb = 1 - team1WinProb;

  // Build factors list
  const factors: PredictionFactor[] = [];
  const eloAdvantage = team1AvgElo - team2AvgElo;

  factors.push({
    name: "ELO advantage",
    value: `${eloAdvantage > 0 ? '+' : ''}${eloAdvantage}`,
    weight: `${Math.abs(eloAdvantage / 50).toFixed(0)}%`,
    impact: eloAdvantage > 0 ? "team1" : eloAdvantage < 0 ? "team2" : "neutral",
  });

  let adjustedProb = team1WinProb;

  // Apply form factor (±5% adjustment)
  if (options?.team1Form !== undefined && options?.team2Form !== undefined) {
    const formAdvantage = (options.team1Form - options.team2Form) * 0.05;
    adjustedProb += formAdvantage;

    if (Math.abs(formAdvantage) > 0.01) {
      factors.push({
        name: "Recent form",
        value: `${options.team1Form > options.team2Form ? '+' : ''}${(formAdvantage * 100).toFixed(0)}%`,
        weight: `±5%`,
        impact: formAdvantage > 0 ? "team1" : "team2",
      });
    }
  }

  // Apply head-to-head factor (±10% adjustment)
  if (options?.team1HeadToHead !== undefined && options?.team2HeadToHead !== undefined) {
    const h2hAdvantage = (options.team1HeadToHead - options.team2HeadToHead) * 0.10;
    adjustedProb += h2hAdvantage;

    if (Math.abs(h2hAdvantage) > 0.01) {
      factors.push({
        name: "Head-to-head",
        value: `${options.team1HeadToHead > options.team2HeadToHead ? '+' : ''}${(h2hAdvantage * 100).toFixed(0)}%`,
        weight: `±10%`,
        impact: h2hAdvantage > 0 ? "team1" : "team2",
      });
    }
  }

  // Apply streak factor (±5% adjustment)
  if (options?.team1Streak !== undefined && options?.team2Streak !== undefined) {
    const streakAdvantage = (Math.tanh(options.team1Streak / 3) - Math.tanh(options.team2Streak / 3)) * 0.05;
    adjustedProb += streakAdvantage;

    if (Math.abs(streakAdvantage) > 0.01) {
      factors.push({
        name: "Current streak",
        value: `${options.team1Streak > options.team2Streak ? '+' : ''}${(streakAdvantage * 100).toFixed(0)}%`,
        weight: `±5%`,
        impact: streakAdvantage > 0 ? "team1" : "team2",
      });
    }
  }

  // Apply partnership synergy factor (±5% adjustment)
  if (options?.team1PartnershipRate !== undefined && options?.team2PartnershipRate !== undefined) {
    const partnershipAdvantage = (options.team1PartnershipRate - options.team2PartnershipRate) * 0.05;
    adjustedProb += partnershipAdvantage;

    if (Math.abs(partnershipAdvantage) > 0.01) {
      factors.push({
        name: "Partner synergy",
        value: `${options.team1PartnershipRate > options.team2PartnershipRate ? '+' : ''}${(partnershipAdvantage * 100).toFixed(0)}%`,
        weight: `±5%`,
        impact: partnershipAdvantage > 0 ? "team1" : "team2",
      });
    }
  }

  // Clamp to reasonable range [0.05, 0.95]
  adjustedProb = Math.max(0.05, Math.min(0.95, adjustedProb));

  // Determine predicted winner
  const predictedWinner: 1 | 2 = adjustedProb > 0.5 ? 1 : 2;

  // Determine confidence level
  const confidence = getConfidenceLevel(Math.max(adjustedProb, 1 - adjustedProb));

  return {
    team1WinProb: adjustedProb,
    team2WinProb: 1 - adjustedProb,
    predictedWinner,
    confidence,
    factors,
  };
}
