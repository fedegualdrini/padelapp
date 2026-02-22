"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

/**
 * Component that reads toast params from URL and displays them as toast notifications.
 * Cleans up the URL after displaying the toast.
 * 
 * Usage: Add this to layouts or pages that receive redirects with toast params.
 * 
 * Example redirect URL: /g/slug/matches/123?toast=success&message=Partido%20guardado
 */
export function ToastHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (hasShownToast.current) return;

    const toastType = searchParams.get("toast");
    const toastMessage = searchParams.get("message");

    if (toastType && toastMessage) {
      hasShownToast.current = true;
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
        case "info":
          toast.info(decodedMessage);
          break;
        default:
          toast(decodedMessage);
      }

      // Clean up URL by removing toast params
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("toast");
      newSearchParams.delete("message");
      
      const newUrl = newSearchParams.toString()
        ? `${pathname}?${newSearchParams.toString()}`
        : pathname;
      
      // Use replace to avoid adding to history
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null;
}
