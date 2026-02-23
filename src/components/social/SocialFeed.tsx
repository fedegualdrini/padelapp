"use client";

import { useState } from "react";
import { FeedPost } from "./FeedPost";
import { createPostAction } from "@/app/actions/social";
import type { SocialPostRow } from "@/app/actions/social";

interface SocialFeedProps {
  groupId: string;
  initialPosts: SocialPostRow[];
  currentUserId?: string;
}

export function SocialFeed({ groupId, initialPosts, currentUserId }: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPostRow[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitPost = async () => {
    if (!newPostContent.trim() || !currentUserId) return;

    setIsSubmitting(true);
    setError(null);

    const result = await createPostAction({
      groupId,
      playerId: currentUserId,
      postType: "discussion",
      content: newPostContent.trim(),
    });

    if (result.success && result.post) {
      setPosts([result.post, ...posts]);
      setNewPostContent("");
    } else {
      setError(result.error || "Error al crear publicación");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Create Post Section */}
      {currentUserId && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-background-dark dark:text-white font-bold text-lg mb-4">
            Compartir algo
          </h3>
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="¿Qué quieres compartir con el grupo?"
            className="w-full p-4 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-background-dark dark:text-white resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            maxLength={5000}
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
          <div className="flex justify-between items-center mt-4">
            <span className="text-slate-400 text-sm">
              {newPostContent.length}/5000
            </span>
            <button
              onClick={handleSubmitPost}
              disabled={!newPostContent.trim() || isSubmitting}
              className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Publicando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Publicar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">
              forum
            </span>
            <h3 className="text-background-dark dark:text-white font-bold text-xl mb-2">
              No hay publicaciones aún
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              ¡Sé el primero en compartir algo con el grupo!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onLike={() => {
                // Handle like update - will be implemented with optimistic updates
                setPosts(posts.map((p) =>
                  p.id === post.id
                    ? { ...p, likes_count: p.likes_count + (p.liked_by_current_user ? -1 : 1) }
                    : p
                ));
              }}
              onDelete={() => {
                setPosts(posts.filter((p) => p.id !== post.id));
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
