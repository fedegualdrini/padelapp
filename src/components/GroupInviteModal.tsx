"use client";

import { useState, useTransition } from "react";
import { createInviteAction } from "@/app/actions/invites";
import { GroupInvite } from "@/lib/data";
import { X, Copy, Check, QrCode, Share2, Calendar, Users } from "lucide-react";

type GroupInviteModalProps = {
  groupId: string;
  slug: string;
  onClose: () => void;
  onSuccess?: (invite: GroupInvite) => void;
  onError?: (error: string) => void;
};

type ExpirationOption = { label: string; value: number | null };
type MaxUsesOption = { label: string; value: number | null };

const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { label: "Nunca", value: null },
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
];

const MAX_USES_OPTIONS: MaxUsesOption[] = [
  { label: "Ilimitado", value: null },
  { label: "1 uso", value: 1 },
  { label: "5 usos", value: 5 },
  { label: "10 usos", value: 10 },
  { label: "20 usos", value: 20 },
];

export default function GroupInviteModal({
  groupId,
  slug,
  onClose,
  onSuccess,
  onError,
}: GroupInviteModalProps) {
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Create new invite
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [maxUses, setMaxUses] = useState<number | null>(null);

  const handleCreateInvite = () => {
    setError("");
    setInvite(null);
    startTransition(async () => {
      try {
        const result = await createInviteAction(groupId, expiresInDays, maxUses);

        if (!result.success) {
          setError(result.error || "Error creating invite");
          onError?.(result.error || "Error creating invite");
          return;
        }

        setInvite(result.invite);
        onSuccess?.(result.invite!);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(message);
      }
    });
  };

  // Copy invite link to clipboard
  const handleCopyLink = async () => {
    if (!invite) return;

    try {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || '';
      
      const inviteUrl = `${baseUrl}/invite/${invite.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("Failed to copy link to clipboard");
    }
  };

  // Share invite (mobile)
  const handleShare = async () => {
    if (!invite) return;

    try {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || '';
      
      const inviteUrl = `${baseUrl}/invite/${invite.token}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Join ${slug} on Padel Tracker`,
          text: `You're invited to join our Padel Tracker group!`,
          url: inviteUrl,
        });
      } else {
        // Fallback to copy if Web Share API not available
        handleCopyLink();
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  // Format expiration date
  const formatExpiration = (expiresAt: string | null) => {
    if (!expiresAt) return "Never";
    return new Date(expiresAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get invite URL for QR code and display
  const getInviteUrl = () => {
    if (!invite) return "";
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/invite/${invite.token}`;
  };

  // Generate QR code using a public API
  const getQRCodeUrl = () => {
    const inviteUrl = getInviteUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl text-[var(--ink)]">Invite Members</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {invite ? "Share invite link" : "Create a new invite link"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[color:var(--card-border)] hover:text-[var(--ink)]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {!invite ? (
          /* Create Invite Form */
          <div className="space-y-4">
            {/* Expiration */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
                <Calendar size={16} />
                Link expiration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXPIRATION_OPTIONS.map((option) => (
                  <button
                    key={option.value ?? "never"}
                    onClick={() => setExpiresInDays(option.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      expiresInDays === option.value
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[color:var(--card-border)] bg-[color:var(--card-solid)] text-[var(--ink)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Uses */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
                <Users size={16} />
                Maximum uses
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MAX_USES_OPTIONS.map((option) => (
                  <button
                    key={option.value ?? "unlimited"}
                    onClick={() => setMaxUses(option.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      maxUses === option.value
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[color:var(--card-border)] bg-[color:var(--card-solid)] text-[var(--ink)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateInvite}
              disabled={isPending}
              className="w-full rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Invite Link"}
            </button>
          </div>
        ) : (
          /* Invite Link Display */
          <div className="space-y-4">
            {/* Invite Link */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
                Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getInviteUrl()}
                  readOnly
                  className="flex-1 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-2 text-sm text-[var(--ink)]"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)]"
                  title="Copy link"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Button (Mobile) */}
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)]"
              >
                <Share2 size={16} />
                Share invite
              </button>
            )}

            {/* QR Code Toggle */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)]"
            >
              <QrCode size={16} />
              {showQR ? "Hide QR Code" : "Show QR Code"}
            </button>

            {/* QR Code Display */}
            {showQR && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-6">
                <img
                  src={getQRCodeUrl()}
                  alt="Invite QR Code"
                  className="h-48 w-48 rounded-lg"
                />
                <p className="text-xs text-[var(--muted)]">
                  Scan to join the group
                </p>
              </div>
            )}

            {/* Invite Details */}
            <div className="space-y-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Expiration</span>
                <span className="font-medium text-[var(--ink)]">
                  {formatExpiration(invite.expiresAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Uses</span>
                <span className="font-medium text-[var(--ink)]">
                  {invite.useCount} / {invite.maxUses ?? "∞"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setInvite(null);
                  setError("");
                }}
                disabled={isPending}
                className="flex-1 rounded-full border border-[color:var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[color:var(--card-border)] disabled:opacity-50"
              >
                Create New Link
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
