"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  iconEmoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  iconEmoji,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 sm:p-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur ${className}`}
    >
      <div className="flex flex-col items-center gap-4 sm:gap-5 text-center">
        {/* Icon or Emoji */}
        {Icon ? (
          <div className="rounded-full bg-[color:var(--bg-hover)] p-3 sm:p-4">
            <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-[var(--muted)]" />
          </div>
        ) : iconEmoji ? (
          <div className="text-4xl sm:text-5xl">{iconEmoji}</div>
        ) : null}

        {/* Title and Description */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <h3 className="font-display text-lg sm:text-xl text-[var(--ink)]">
            {title}
          </h3>
          {description && (
            <p className="text-sm sm:text-base text-[var(--muted)] max-w-sm">
              {description}
            </p>
          )}
        </div>

        {/* Action Button */}
        {action && (
          <div className="flex flex-col sm:flex-row gap-3">
            {action.href ? (
              <Link
                href={action.href}
                className="rounded-full bg-[var(--accent)] px-5 sm:px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
              >
                {action.label}
              </Link>
            ) : action.onClick ? (
              <button
                onClick={action.onClick}
                className="rounded-full bg-[var(--accent)] px-5 sm:px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,95,0.25)] transition hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
              >
                {action.label}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
