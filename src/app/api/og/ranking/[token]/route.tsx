import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type RankingData = {
  group_id: string;
  group_name: string;
  group_slug: string;
  player_id: string;
  player_name: string;
  player_status: "usual" | "invite";
  current_elo: number;
  matches_played: number;
  elo_change: number;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.rpc("get_public_ranking_by_token", {
    p_token: token,
  });

  if (!data || (data as RankingData[]).length === 0) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontSize: 48,
            fontWeight: "bold",
          }}
        >
          Ranking Not Found
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  const rankings = data as RankingData[];
  const group = rankings[0];
  const top3 = rankings.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: 60,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              marginBottom: 16,
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {group.group_name}
          </h1>
          <p
            style={{
              fontSize: 32,
              opacity: 0.9,
            }}
          >
            ELO Rankings
          </p>
        </div>

        {/* Top 3 Players */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginBottom: 40,
          }}
        >
          {top3.map((player, index) => {
            const rankColors = [
              "#ffd700",
              "#c0c0c0",
              "#cd7f32"
            ];
            const rankEmojis = ["🥇", "🥈", "🥉"];

            return (
              <div
                key={player.player_id}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 16,
                  padding: 24,
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 12,
                  }}
                >
                  {rankEmojis[index]}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    marginBottom: 8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {player.player_name}
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: rankColors[index],
                  }}
                >
                  {player.current_elo}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    opacity: 0.8,
                    marginTop: 8,
                  }}
                >
                  {player.matches_played} matches
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Players */}
        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 20,
            display: "inline-block",
          }}
        >
          <div style={{ fontSize: 24, opacity: 0.9 }}>
            Total Players: <strong>{rankings.length}</strong>
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            fontSize: 24,
            opacity: 0.8,
          }}
        >
          padelapp.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
