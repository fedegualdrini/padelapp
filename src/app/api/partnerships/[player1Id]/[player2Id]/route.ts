import { NextRequest, NextResponse } from "next/server";
import { getPartnershipDetail, refreshPartnershipsIfStale } from "@/lib/partnership-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ player1Id: string; player2Id: string }> }
) {
  try {
    const { player1Id, player2Id } = await params;

    if (!player1Id || !player2Id) {
      return NextResponse.json(
        { error: "Both player IDs are required" },
        { status: 400 }
      );
    }

    // Refresh partnerships if stale before querying
    await refreshPartnershipsIfStale();

    const response = await getPartnershipDetail(player1Id, player2Id);

    if (!response) {
      return NextResponse.json(
        { error: "Partnership not found or insufficient data" },
        { status: 404 }
      );
    }

    // Add cache headers (5 minute TTL)
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=300, s-maxage=300");

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Error in GET /api/partnerships/[player1Id]/[player2Id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch partnership details" },
      { status: 500 }
    );
  }
}
