import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupBySlug, isGroupMember } from "@/lib/data";
import { notFound } from "next/navigation";
import ChallengesDashboard from "./challenges-dashboard";

interface PageProps {
  params: { slug: string };
  searchParams: { week?: string };
}

export default async function ChallengesPage({ params, searchParams }: PageProps) {
  const group = await getGroupBySlug(params.slug);
  if (!group) return notFound();

  const member = await isGroupMember(group.id);
  if (!member) return notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  // Get current challenges and progress
  const { data: challengesData } = await supabase.rpc('get_player_challenges', {
    p_group_id: group.id,
    p_player_id: user.id,
  });

  // Get weekly leaderboard
  const currentWeek = searchParams.week
    ? new Date(searchParams.week)
    : new Date();
  const weekStart = new Date(currentWeek);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

  const { data: weeklyLeaderboard } = await supabase.rpc('get_weekly_leaderboard', {
    p_group_id: group.id,
    p_week_start: weekStart.toISOString().split('T')[0],
  });

  // Get player badges
  const { data: rawPlayerBadges } = await supabase
    .from('player_badges')
    .select(`
      earned_at,
      badges (
        name,
        description,
        badge_type,
        milestone_value,
        icon
      )
    `)
    .eq('player_id', user.id)
    .order('earned_at', { ascending: false });

  // Transform badges to match expected type
  const playerBadges = (rawPlayerBadges || []).map(pb => ({
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
