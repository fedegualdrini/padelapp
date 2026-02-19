"use client";

import { useState } from "react";
import { generateRankingShareLink } from "./actions";
import { Check, Copy, Share2 } from "lucide-react";

type ShareRankingButtonProps = {
  slug: string;
};

export function ShareRankingButton({ slug }: ShareRankingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateRankingShareLink(slug);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.token) {
        setError("Failed to generate share link");
        return;
      }

      // Build the share URL
      const shareUrl = `${window.location.origin}/g/${slug}/ranking-share/${result.token}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to generate share link");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleShare}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-2 text-sm font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:var(--card-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--muted)] border-t-[color:var(--ink)]" />
            Generating...
          </>
        ) : copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share Rankings
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
