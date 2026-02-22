"use client";

import { Suspense } from "react";
import { ToastHandler } from "./ToastHandler";

/**
 * Wrapper that provides Suspense boundary for ToastHandler.
 * Required because ToastHandler uses useSearchParams which requires Suspense.
 */
export function ToastHandlerWrapper() {
  return (
    <Suspense fallback={null}>
      <ToastHandler />
    </Suspense>
  );
}
