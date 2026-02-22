import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  // Rate limit check
  const identifier = await getClientIdentifier();
  const rateLimitResult = checkRateLimit(identifier, "event");
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: `Rate limit exceeded. Please wait ${rateLimitResult.retryAfter} seconds before trying again.`,
        retryAfter: rateLimitResult.retryAfter 
      },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.reset),
          "Retry-After": String(rateLimitResult.retryAfter),
        }
      }
    );
  }

  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: result, error } = await supabase.rpc('skip_week', {
    p_group_id: groupId,
    p_player_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add rate limit headers to successful response
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
  headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
  headers.set("X-RateLimit-Reset", String(rateLimitResult.reset));

  return NextResponse.json(result, { headers });
}
