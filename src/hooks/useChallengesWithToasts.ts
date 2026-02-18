"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase/client";

interface ChallengeProgress {
  volume: { completed: boolean };
  performance: { completed: boolean };
  social: { completed: boolean };
  total_completed: number;
}

/**
 * Hook to monitor weekly challenges and automatically show toast notifications
 * for completed challenges
 */
export function useChallengesWithToasts(groupId: string, userId: string) {
  const { showChallengeComplete, showStreakMilestone } = useToast();
  const [previousProgress, setPreviousProgress] = useState<ChallengeProgress | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);

  useEffect(() => {
    if (!groupId || !userId) return;

    const supabase = createSupabaseClient();

    // Function to check for new completions
    const checkChallengeProgress = async () => {
      try {
        const { data, error } = await supabase.rpc('get_player_challenges', {
          p_group_id: groupId,
          p_player_id: userId,
        });

        if (error || !data) return;

        const progress = data.progress as ChallengeProgress;
        const streak = data.streak?.current || 0;

        // Check if this is the first load
        if (!previousProgress) {
          setPreviousProgress(progress);
          setCurrentStreak(streak);
          return;
        }

        // Check for newly completed individual challenges
        if (!previousProgress.volume.completed && progress.volume.completed) {
          showChallengeComplete('volume');
        }
        if (!previousProgress.performance.completed && progress.performance.completed) {
          showChallengeComplete('performance');
        }
        if (!previousProgress.social.completed && progress.social.completed) {
          showChallengeComplete('social');
        }

        // Check if all challenges were just completed
        if (progress.total_completed === 3 && previousProgress.total_completed < 3) {
          showChallengeComplete('all');
        }

        // Check for streak milestones (2, 4, 8, 12, 24)
        const milestones = [2, 4, 8, 12, 24];
        if (previousProgress !== null && currentStreak !== null) {
          for (const milestone of milestones) {
            if (currentStreak < milestone && streak >= milestone) {
              showStreakMilestone(milestone);
              break;
            }
          }
        }

        // Update previous progress
        setPreviousProgress(progress);
        setCurrentStreak(streak);
      } catch (error) {
        console.error('Error checking challenge progress:', error);
      }
    };

    // Initial check
    checkChallengeProgress();

    // Set up interval to check for progress updates (every 30 seconds)
    const interval = setInterval(checkChallengeProgress, 30000);

    return () => clearInterval(interval);
  }, [groupId, userId, previousProgress, currentStreak, showChallengeComplete, showStreakMilestone]);

  return { previousProgress };
}
