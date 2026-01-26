// Client-side ELO utilities for match predictions

export type PredictionResult = {
  team1WinProb: number;
  team2WinProb: number;
  predictedWinner: 1 | 2;
  confidence: "low" | "medium" | "high";
};

export function calculateMatchPrediction(
  team1AvgElo: number,
  team2AvgElo: number
): PredictionResult {
  // Calculate win probabilities using ELO formula
  // Expected score = 1 / (1 + 10^((opponentElo - playerElo) / 400))
  const team1WinProb = 1 / (1 + Math.pow(10, (team2AvgElo - team1AvgElo) / 400));
  const team2WinProb = 1 - team1WinProb;

  // Determine predicted winner
  const predictedWinner: 1 | 2 = team1WinProb > team2WinProb ? 1 : 2;

  // Determine confidence level based on probability spread
  const probDiff = Math.abs(team1WinProb - team2WinProb);
  let confidence: "low" | "medium" | "high" = "medium";
  if (probDiff < 0.2) {
    confidence = "low";
  } else if (probDiff > 0.4) {
    confidence = "high";
  }

  return {
    team1WinProb,
    team2WinProb,
    predictedWinner,
    confidence,
  };
}
