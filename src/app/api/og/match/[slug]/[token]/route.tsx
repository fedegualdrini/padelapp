import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

interface MatchData {
  match_id: string;
  played_at: string;
  best_of: number;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  team1_sets: number[];
  team2_sets: number[];
  elo_deltas?: Array<{
    name: string;
    delta: number;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: matchData } = await supabase.rpc("get_public_match_details", {
    p_slug: slug,
    p_token: token,
  });

  if (!matchData || matchData.length === 0) {
    return new ImageResponse(
      <div
        style={{
          fontSize: 60,
          fontWeight: 800,
          color: "#1a1a1a",
          background: "#f5f5f5",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        Partido no encontrado
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const match = matchData[0] as MatchData;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "20px",
            padding: "40px 60px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            width: "90%",
            maxWidth: "1000px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#666",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            Resultado del Partido
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "40px",
            }}
          >
            <div
              style={{
                flex: 1,
                textAlign: "right",
                fontSize: 40,
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: "1.2",
              }}
            >
              {match.team1_name}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  fontSize: 80,
                  fontWeight: 800,
                  color: "#667eea",
                }}
              >
                <span>{match.team1_score}</span>
                <span style={{ color: "#ccc" }}>-</span>
                <span>{match.team2_score}</span>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                textAlign: "left",
                fontSize: 40,
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: "1.2",
              }}
            >
              {match.team2_name}
            </div>
          </div>

          {match.elo_deltas && match.elo_deltas.length > 0 && (
            <div
              style={{
                marginTop: "30px",
                paddingTop: "20px",
                borderTop: "2px solid #eee",
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {match.elo_deltas.map((player, index: number) => (
                <div
                  key={index}
                  style={{
                    background: player.delta >= 0 ? "#e8f5e9" : "#ffebee",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#666" }}>{player.name}</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: player.delta >= 0 ? "#4caf50" : "#f44336",
                    }}
                  >
                    {player.delta >= 0 ? "+" : ""}
                    {player.delta}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: "30px",
              fontSize: 16,
              color: "#999",
              textAlign: "center",
            }}
          >
            Mejor de {match.best_of} sets • Compartido desde Padelapp
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      emoji: "twemoji",
    }
  );
}
