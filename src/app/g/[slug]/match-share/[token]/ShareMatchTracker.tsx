"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type ShareMatchTrackerProps = {
  matchId: string;
  slug: string;
};

export default function ShareMatchTracker({ matchId, slug }: ShareMatchTrackerProps) {
  useEffect(() => {
    // Track when the shared match page is viewed
    trackEvent({
      name: "match_share_viewed",
      params: { match_id: matchId, group_slug: slug },
    });
  }, [matchId, slug]);

  return null;
}
