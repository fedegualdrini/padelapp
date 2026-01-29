"use server";

import { getPlayerStreaks, type PlayerStreaks } from "./streaks";

export async function fetchPlayerStreaksAction(
  groupId: string,
  playerId: string
): Promise<PlayerStreaks> {
  return await getPlayerStreaks(groupId, playerId);
}
