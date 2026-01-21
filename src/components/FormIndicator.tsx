import { getPlayerRecentForm } from "@/lib/data";

type FormIndicatorProps = {
  groupId: string;
  playerId: string;
  showTooltip?: boolean;
};

export default async function FormIndicator({
  groupId,
  playerId,
  showTooltip = false,
}: FormIndicatorProps) {
  const form = await getPlayerRecentForm(groupId, playerId, 5);

  if (!form || form.recentMatches < 3) {
    return null;
  }

  const getIndicatorStyle = () => {
    switch (form.formIndicator) {
      case "hot":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      case "cold":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const getIndicatorIcon = () => {
    switch (form.formIndicator) {
      case "hot":
        return "🔥";
      case "cold":
        return "❄️";
      default:
        return "➡️";
    }
  };

  const getTooltipText = () => {
    if (!form.streak) return `${form.wins}W-${form.losses}L`;
    const streakText = form.streak.type === "win" ? "W" : "L";
    return `${form.wins}W-${form.losses}L (${form.streak.count}${streakText} streak)`;
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getIndicatorStyle()}`}
      title={showTooltip ? getTooltipText() : undefined}
    >
      <span>{getIndicatorIcon()}</span>
      {showTooltip && <span className="hidden sm:inline">{getTooltipText()}</span>}
    </span>
  );
}
