import AchievementBadge from './AchievementBadge';

type Achievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

type AchievementsRowProps = {
  achievements: Achievement[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
};

export default function AchievementsRow({
  achievements,
  max = 3,
  size = 'sm',
}: AchievementsRowProps) {
  if (achievements.length === 0) {
    return null;
  }

  // Sort by rarity (legendary > epic > rare > common) then by name
  const rarityOrder = { legendary: 1, epic: 2, rare: 3, common: 4 };
  const sorted = [...achievements].sort((a, b) => {
    const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    return a.name.localeCompare(b.name);
  });

  const displayed = sorted.slice(0, max);

  return (
    <div className="flex items-center gap-1.5">
      {displayed.map((achievement) => (
        <AchievementBadge
          key={achievement.key}
          name={achievement.name}
          description={achievement.description}
          icon={achievement.icon}
          rarity={achievement.rarity}
          size={size}
          showTooltip={true}
        />
      ))}
      {achievements.length > max && (
        <span className="text-xs text-[var(--muted)]">
          +{achievements.length - max}
        </span>
      )}
    </div>
  );
}
