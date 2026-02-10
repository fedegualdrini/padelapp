type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

type AchievementBadgeProps = {
  name: string;
  description?: string;
  icon: string;
  rarity: AchievementRarity;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
};

const rarityColors = {
  common: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    shadow: 'shadow-gray-500/10',
  },
  rare: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    shadow: 'shadow-blue-500/10',
  },
  epic: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    shadow: 'shadow-purple-500/10',
  },
  legendary: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    shadow: 'shadow-yellow-500/10',
  },
};

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-10 h-10 text-lg',
  lg: 'w-16 h-16 text-2xl',
};

export default function AchievementBadge({
  name,
  description,
  icon,
  rarity,
  size = 'md',
  showTooltip = false,
}: AchievementBadgeProps) {
  const colors = rarityColors[rarity];
  const sizeClass = sizeClasses[size];

  if (showTooltip) {
    return (
      <div className="group relative inline-flex">
        <div
          className={`
            ${sizeClass}
            ${colors.bg}
            ${colors.border}
            border
            ${colors.shadow}
            shadow-sm
            rounded-lg
            flex items-center justify-center
            cursor-help
            transition-all duration-300
            hover:scale-110
            hover:shadow-md
          `}
        >
          <span className={colors.text}>{icon}</span>
        </div>
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200
          z-50
        ">
          <div className="
            min-w-[200px] p-3 rounded-lg
            bg-[color:var(--card-solid)]
            border border-[color:var(--card-border)]
            shadow-lg
            text-center
          ">
            <p className="font-semibold text-[var(--ink)] text-sm">{name}</p>
            {description && (
              <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
            )}
            <div className={`mt-2 text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
              {rarity}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClass}
        ${colors.bg}
        ${colors.border}
        border
        ${colors.shadow}
        shadow-sm
        rounded-lg
        flex items-center justify-center
        transition-transform duration-300
        hover:scale-110
      `}
    >
      <span className={colors.text}>{icon}</span>
    </div>
  );
}
