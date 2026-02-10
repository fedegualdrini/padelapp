"use server";

import { getPlayerStreaks, type PlayerStreaks } from "./streaks";
import { getGroupPlayerStreaks } from "./streaks-group";

export async function fetchPlayerStreaksAction(
  groupId: string,
  playerId: string
): Promise<PlayerStreaks> {
  return await getPlayerStreaks(groupId, playerId);
}

export async function fetchGroupStreaksAction(
  groupId: string
): Promise<Record<string, PlayerStreaks>> {
  return await getGroupPlayerStreaks(groupId);
}
