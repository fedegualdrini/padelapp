"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type ConfirmDialogProps = {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog should close (cancel or X button) */
  onClose: () => void;
  /** Called when user confirms the action */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  message: string;
  /** Text for the confirm button (default: "Confirmar") */
  confirmText?: string;
  /** Text for the cancel button (default: "Cancelar") */
  cancelText?: string;
  /** Variant affects confirm button styling (default: "danger") */
  variant?: "danger" | "warning" | "default";
  /** Whether an action is in progress */
  loading?: boolean;
  /** Loading state text */
  loadingText?: string;
};

/**
 * A reusable confirmation dialog for destructive actions.
 * Follows the existing modal pattern with keyboard accessibility (Escape to cancel).
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
  loadingText = "Procesando...",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, loading]);

  // Focus management
  useEffect(() => {
    if (open && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const confirmButtonStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-orange-500 hover:bg-orange-600 text-white",
    default: "bg-[var(--accent)] hover:opacity-90 text-white",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)] backdrop-blur"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3
            id="confirm-dialog-title"
            className="font-display text-xl text-[var(--ink)]"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[color:var(--card-border)] hover:text-[var(--ink)] disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <p
          id="confirm-dialog-description"
          className="mt-3 text-sm text-[var(--muted)]"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-[color:var(--card-border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)] disabled:opacity-50 min-h-[44px]"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 min-h-[44px] ${confirmButtonStyles[variant]}`}
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
