import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug, isGroupMember } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import ChallengesDashboard from "./challenges-dashboard";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: { week?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  return {
    title: group ? `Challenges — ${group.name}` : "Weekly Challenges",
    description: group
      ? `Weekly challenges and badges for ${group.name}. Track your progress and compete with your group.`
      : "Weekly challenges and badges.",
  };
}

export default async function ChallengesPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) return notFound();

  // Membership is enforced by /(protected)/layout.tsx (redirects to /join)
  // If we reach this point, the user should be a member (or it's demo mode)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If there's no user, show a join prompt
  // The membership check in the layout should handle the redirect to /join, but this is a fallback
  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h2 className="font-display text-2xl text-[var(--ink)]">Acceso requerido</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Necesitás ser miembro del grupo para ver los desafíos.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/g/${slug}/join`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Unirse al grupo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if the user is a member of the group
  // The layout should handle this, but we add a fallback to ensure graceful handling
  const isMember = await isGroupMember(group.id);
  if (!isMember) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <h2 className="font-display text-2xl text-[var(--ink)]">Únete al grupo</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Aún no sos miembro de este grupo. Unite para ver los desafíos y participar.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/g/${slug}/join`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Unirse al grupo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current week (Monday)
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday of current week
  const weekStartStr = currentWeekStart.toISOString().split("T")[0];

  // Ensure weekly challenges are generated for this group (generates on Monday if not exists)
  await supabase.rpc("get_or_create_weekly_challenges", {
    p_group_id: group.id,
    p_week_start: weekStartStr,
  });

  // Initialize weekly progress for this player if not exists
  await supabase.rpc("initialize_weekly_progress", {
    p_group_id: group.id,
    p_week_start: weekStartStr,
  });

  const { data: challengesData } = await supabase.rpc("get_player_challenges", {
    p_group_id: group.id,
    p_player_id: user.id,
  });

  const currentWeek = searchParams.week ? new Date(searchParams.week) : new Date();
  const weekStart = new Date(currentWeek);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

  const { data: weeklyLeaderboard } = await supabase.rpc("get_weekly_leaderboard", {
    p_group_id: group.id,
    p_week_start: weekStart.toISOString().split("T")[0],
  });

  const { data: rawPlayerBadges } = await supabase
    .from("player_badges")
    .select(
      `
      earned_at,
      badges (
        name,
        description,
        badge_type,
        milestone_value,
        icon
      )
    `
    )
    .eq("player_id", user.id)
    .order("earned_at", { ascending: false });

  const playerBadges = (rawPlayerBadges || []).map((pb) => ({
    earned_at: pb.earned_at,
    badges: Array.isArray(pb.badges) ? pb.badges[0] : pb.badges,
  }));

  return (
    <ChallengesDashboard
      group={group}
      challengesData={challengesData || null}
      weeklyLeaderboard={weeklyLeaderboard || null}
      playerBadges={playerBadges}
      userId={user.id}
    />
  );
}
