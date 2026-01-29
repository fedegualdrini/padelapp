import { type ActivityItem } from "@/lib/data";

type ActivityFeedProps = {
  activities: ActivityItem[];
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "ahora mismo";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `hace ${diffInHours} hora${diffInHours !== 1 ? "s" : ""}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `hace ${diffInDays} día${diffInDays !== 1 ? "s" : ""}`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `hace ${diffInWeeks} semana${diffInWeeks !== 1 ? "s" : ""}`;
    }

    // Format as date if more than a month
    return then.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: then.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getIcon = (type: ActivityItem["type"]): string => {
    switch (type) {
      case "match_created":
        return "🎾";
      case "match_edited":
        return "✏️";
      case "mvp_assigned":
        return "🏆";
      case "player_added":
        return "👤";
      default:
        return "📝";
    }
  };

  return (
    <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <h3 className="font-display text-xl text-[var(--ink)]">
        Actividad reciente
      </h3>
      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Sin actividad reciente.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--card-solid)] text-lg">
                  {getIcon(activity.type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="my-1 w-0.5 flex-1 bg-[color:var(--card-border)]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-[var(--ink)]">
                  <span className="font-semibold">{activity.actor}</span>{" "}
                  {activity.description}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {formatRelativeTime(activity.changedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
