"use client";

import { useState, useEffect } from "react";
import { addCommentAction, deleteCommentAction } from "@/app/actions/social";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  post_id: string;
  player_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  players?: {
    name: string;
  } | null;
}

interface PostCommentsProps {
  postId: string;
  currentUserId?: string;
  initialCount: number;
}

export function PostComments({ postId, currentUserId, initialCount }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("social_comments")
        .select("*, players(name)")
        .eq("post_id", postId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await addCommentAction({
      postId,
      playerId: currentUserId,
      content: newComment.trim(),
    });

    if (result.success) {
      setNewComment("");
      await loadComments(); // Reload comments to show the new one
    } else {
      setError(result.error || "Error al agregar comentario");
    }

    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      return;
    }

    const result = await deleteCommentAction(commentId, currentUserId!);

    if (result.success) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins}min`;

    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      {/* Add Comment */}
      {currentUserId && (
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center text-background-dark font-bold text-sm shrink-0">
              {currentUserId.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full p-3 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={2}
                maxLength={2000}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-400 text-xs">
                  {newComment.length}/2000
                </span>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="text-primary font-bold text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">
              refresh
            </span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2 block">chat_bubble_outline</span>
            <p className="text-sm">No hay comentarios aún</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {comment.players?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-background-dark dark:text-white font-bold text-sm">
                        {comment.players?.name || "Usuario"}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-background-dark dark:text-slate-200 text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>

                  {/* Delete button for comment author */}
                  {comment.player_id === currentUserId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
