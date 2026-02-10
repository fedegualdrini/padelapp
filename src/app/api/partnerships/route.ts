import { NextRequest, NextResponse } from "next/server";
import { getPartnerships, refreshPartnershipsIfStale } from "@/lib/partnership-data";
import type { PartnershipsQueryParams } from "@/lib/partnership-types";

export async function GET(request: NextRequest) {
  try {
    // Refresh partnerships if stale before querying
    await refreshPartnershipsIfStale();

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const params: PartnershipsQueryParams = {
      player_id: searchParams.get("player_id") || undefined,
      min_matches: parseInt(searchParams.get("min_matches") || "3", 10),
      sort_by: (searchParams.get("sort_by") as PartnershipsQueryParams["sort_by"]) || "win_rate",
      sort_order: (searchParams.get("sort_order") as "asc" | "desc") || "desc",
      limit: parseInt(searchParams.get("limit") || "50", 10),
      offset: parseInt(searchParams.get("offset") || "0", 10),
    };

    // Validate sort_by
    const validSortColumns = ["win_rate", "matches_played", "elo_change_delta", "synergy_score", "last_played_together"];
    if (params.sort_by && !validSortColumns.includes(params.sort_by)) {
      params.sort_by = "win_rate";
    }

    // Validate limit (max 100)
    if (params.limit && params.limit > 100) {
      params.limit = 100;
    }

    const response = await getPartnerships(params);

    // Add cache headers (5 minute TTL)
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=300, s-maxage=300");

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Error in GET /api/partnerships:", error);
    return NextResponse.json(
      { error: "Failed to fetch partnerships", partnerships: [], total: 0 },
      { status: 500 }
    );
  }
}
