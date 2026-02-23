"use client";

import { useState, useEffect } from "react";
import { toggleLikePostAction } from "@/app/actions/social";

interface PostLikesProps {
  postId: string;
  likesCount: number;
  currentUserId?: string;
  onLike?: () => void;
}

export function PostLikes({ postId, likesCount: initialLikes, currentUserId, onLike }: PostLikesProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user has liked the post
  useEffect(() => {
    if (!currentUserId) return;

    const checkLikeStatus = async () => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { data, error } = await supabase
          .from("social_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("player_id", currentUserId)
          .single();

        if (data && !error) {
          setIsLiked(true);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [postId, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId || isLoading) return;

    setIsLoading(true);
    const result = await toggleLikePostAction(postId, currentUserId);

    if (result.success) {
      setIsLiked(result.liked);
      setLikesCount(result.liked ? likesCount + 1 : likesCount - 1);
      if (onLike) onLike();
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={!currentUserId || isLoading}
      className={`flex items-center gap-2 font-medium text-sm transition-all ${
        isLiked
          ? "text-primary"
          : "text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary"
      } ${!currentUserId || isLoading ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="material-symbols-outlined">
        {isLiked ? "thumb_up" : "thumb_up_off_alt"}
      </span>
      <span>{likesCount}</span>
      <span className="hidden sm:inline">
        {likesCount === 1 ? "Me gusta" : "Me gustas"}
      </span>
    </button>
  );
}
