"use server";

import { getPlayerRecentForm, type PlayerForm } from "./data";

export async function fetchPlayerRecentFormAction(
  groupId: string,
  playerId: string,
  matchCount: number = 10
): Promise<PlayerForm | null> {
  return await getPlayerRecentForm(groupId, playerId, matchCount);
}
