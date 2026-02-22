"use client";

import { toast } from "sonner";
import { useActionState, useEffect } from "react";
import { formatErrorMessage } from "@/lib/toast-utils";

/**
 * Type for actions that return a result with success/error
 */
export type ActionState = {
  success?: boolean;
  error?: string | null;
  message?: string;
  [key: string]: unknown;
};

/**
 * Hook for actions that use the ActionState pattern
 */
export function useActionStateWithToast(
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState> | ActionState,
  initialState: ActionState = {},
  options: {
    onSuccess?: (state: ActionState) => void;
    onError?: (error: string) => void;
    successMessage?: string;
  } = {}
) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      const message = state.message || options.successMessage;
      if (message) {
        toast.success(message);
      }
      options.onSuccess?.(state);
    } else if (state?.error) {
      toast.error(state.error);
      options.onError?.(state.error);
    }
  }, [state, options]);

  return { state, formAction, isPending };
}

/**
 * Simple toast functions for imperative use
 */
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  loading: (message: string) => toast.loading(message),
  dismiss: (id?: string | number) => toast.dismiss(id),
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages),
};

/**
 * Show toast from URL search params (for redirected actions)
 * Usage: Call this in a useEffect on pages that receive redirect with toast params
 */
export function useToastFromParams(
  searchParams: { get: (key: string) => string | null },
  onConsumed?: () => void
) {
  useEffect(() => {
    const toastType = searchParams.get("toast");
    const toastMessage = searchParams.get("message");

    if (toastType && toastMessage) {
      const decodedMessage = decodeURIComponent(toastMessage);
      
      switch (toastType) {
        case "success":
          toast.success(decodedMessage);
          break;
        case "error":
          toast.error(decodedMessage);
          break;
        case "warning":
          toast.warning(decodedMessage);
          break;
        default:
          toast.info(decodedMessage);
      }

      // Clean up URL
      onConsumed?.();
    }
  }, [searchParams, onConsumed]);
}

/**
 * Build URL with toast params for redirect scenarios
 */
export function buildToastUrl(basePath: string, type: "success" | "error" | "warning" | "info", message: string): string {
  const url = new URL(basePath, "http://dummy.com");
  url.searchParams.set("toast", type);
  url.searchParams.set("message", encodeURIComponent(message));
  return url.pathname + url.search;
}

/**
 * Wrapper for showing error toast from caught error
 */
export function showErrorToast(error: unknown) {
  toast.error(formatErrorMessage(error));
}
