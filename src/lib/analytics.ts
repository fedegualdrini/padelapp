/**
 * Simple analytics tracking utility
 * This is a placeholder for GA4 or other analytics integration
 * For now, it just logs to console for development purposes
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type AnalyticsEvent =
  | { name: "match_share_generated"; params: { match_id: string; group_slug: string } }
  | { name: "match_share_viewed"; params: { match_id: string; group_slug: string } }
  | { name: "ranking_share_generated"; params: { group_id: string; group_slug: string } }
  | { name: "ranking_share_viewed"; params: { group_id: string; group_slug: string } }
  | { name: "match_created"; params: { group_id: string; group_slug: string } }
  | { name: "player_registered"; params: { group_id: string; group_slug: string } };

/**
 * Track an analytics event
 * In production, this would send to GA4 or other analytics service
 */
export function trackEvent(event: AnalyticsEvent) {
  // Log to console for development
  console.log(`[Analytics] ${event.name}`, event.params);

  // Send to Google Analytics if available
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event.name, event.params);
  }

  // TODO: Implement proper GA4 integration
  // TODO: Add event tracking database logging for internal analytics
}

/**
 * Initialize analytics
 * Call this in the app's root layout or on app initialization
 */
export function initAnalytics(measurementId?: string) {
  if (typeof window === "undefined") return;

  // Initialize Google Analytics if measurement ID is provided
  if (measurementId) {
    // Load gtag.js
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Configure gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: any[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId);

    console.log(`[Analytics] Initialized with GA4: ${measurementId}`);
  } else {
    console.log("[Analytics] No measurement ID provided, using console-only mode");
  }
}
