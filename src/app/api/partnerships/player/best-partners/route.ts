import { NextRequest, NextResponse } from "next/server";
import { getPlayerBestPartners, refreshPartnershipsIfStale } from "@/lib/partnership-data";

export async function GET(request: NextRequest) {
  try {
    // Get player ID from query params (not route params - this route has no dynamic segment)
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("player");

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 }
      );
    }

    // Refresh partnerships if stale before querying
    await refreshPartnershipsIfStale();

    const response = await getPlayerBestPartners(playerId);

    if (!response) {
      return NextResponse.json(
        { error: "Player not found or no partnerships data available" },
        { status: 404 }
      );
    }

    // Add cache headers (5 minute TTL)
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=300, s-maxage=300");

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Error in GET /api/partnerships/player/best-partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch player partnerships" },
      { status: 500 }
    );
  }
}
