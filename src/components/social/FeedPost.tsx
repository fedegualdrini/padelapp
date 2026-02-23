"use client";

import { useState } from "react";
import { PostLikes } from "./PostLikes";
import { PostComments } from "./PostComments";
import { deletePostAction } from "@/app/actions/social";
import type { SocialPostRow } from "@/app/actions/social";

interface FeedPostProps {
  post: SocialPostRow;
  currentUserId?: string;
  onLike?: () => void;
  onDelete?: () => void;
}

export function FeedPost({ post, currentUserId, onLike, onDelete }: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      return;
    }

    setIsDeleting(true);
    const result = await deletePostAction(post.id, post.group_id);
    setIsDeleting(false);

    if (result.success && onDelete) {
      onDelete();
    }
  };

  const getPostTypeLabel = (type: SocialPostRow["post_type"]) => {
    const labels = {
      match_result: "Resultado de Partido",
      announcement: "Anuncio",
      discussion: "Discusión",
      booking: "Reserva",
    };
    return labels[type] || type;
  };

  const getPostTypeColor = (type: SocialPostRow["post_type"]) => {
    const colors = {
      match_result: "bg-primary text-background-dark",
      announcement: "bg-blue-500 text-white",
      discussion: "bg-purple-500 text-white",
      booking: "bg-orange-500 text-white",
    };
    return colors[type] || "bg-slate-500 text-white";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins}min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Post Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-background-dark font-bold text-lg">
              {post.players?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h4 className="text-background-dark dark:text-white font-bold">
                {post.players?.name || "Usuario"}
              </h4>
              <p className="text-slate-500 text-sm flex items-center gap-1">
                <span>{formatDate(post.created_at)}</span>
                <span>·</span>
                <span className={getPostTypeColor(post.post_type) + " text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"}>
                  {getPostTypeLabel(post.post_type)}
                </span>
              </p>
            </div>
          </div>

          {/* Delete button for post author */}
          {post.player_id === currentUserId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <span className="material-symbols-outlined">
                {isDeleting ? "refresh" : "delete"}
              </span>
            </button>
          )}
        </div>

        {/* Post Content */}
        <p className="text-background-dark dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Post Actions */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-6">
          <PostLikes
            postId={post.id}
            likesCount={post.likes_count}
            currentUserId={currentUserId}
            onLike={onLike}
          />

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors font-medium text-sm"
          >
            <span className="material-symbols-outlined">
              {showComments ? "expand_less" : "mode_comment"}
            </span>
            {post.comments_count > 0 && (
              <span>{post.comments_count}</span>
            )}
            <span>Comentarios</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <PostComments
            postId={post.id}
            currentUserId={currentUserId}
            initialCount={post.comments_count}
          />
        </div>
      )}
    </div>
  );
}
