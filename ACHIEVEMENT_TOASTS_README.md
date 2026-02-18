# Achievement/Challenge Toast Notifications

## Overview

This document describes the toast notification system for achievements and challenges.

## Components

### ToastProvider

The `ToastProvider` component should be wrapped around your application to enable toast notifications. It's already integrated into the `AppShell` component, so no additional setup is needed in most cases.

**Location:** `src/components/ui/toast.tsx`

### useToast Hook

The `useToast` hook provides methods to show different types of toast notifications:

```tsx
import { useToast } from "@/components/ui/toast";

function MyComponent() {
  const {
    showAchievement,
    showChallengeComplete,
    showStreakMilestone,
    addToast,
  } = useToast();

  // Show achievement notification
  showAchievement({
    name: "Primera Victoria",
    description: "Ganaste tu primer partido",
    icon: "🏆",
    rarity: "common",
  });

  // Show challenge completion notification
  showChallengeComplete('volume'); // 'volume' | 'performance' | 'social' | 'all'

  // Show streak milestone notification
  showStreakMilestone(4); // 2, 4, 8, 12, 24 weeks

  // Show custom toast
  addToast({
    type: 'info',
    title: 'Custom Title',
    message: 'Custom message',
    duration: 5000,
  });
}
```

## Integration with Achievements

### useAchievementsWithToasts Hook

This hook combines achievement checking with automatic toast notifications:

```tsx
import { useAchievementsWithToasts } from "@/hooks/useAchievementsWithToasts";

function MatchComponent({ groupId, userId }) {
  const { checkAndNotify } = useAchievementsWithToasts();

  const handleMatchComplete = async () => {
    // ... save match ...

    // Check for new achievements and show toasts
    await checkAndNotify(groupId, userId);
  };

  return <button onClick={handleMatchComplete}>Complete Match</button>;
}
```

## Integration with Challenges

### useChallengesWithToasts Hook

This hook automatically monitors weekly challenge progress and shows toasts when challenges are completed:

```tsx
import { useChallengesWithToasts } from "@/hooks/useChallengesWithToasts";

function ChallengesPage({ groupId, userId }) {
  useChallengesWithToasts(groupId, userId);

  // The hook will automatically show toasts when:
  // - Individual challenges are completed
  // - All weekly challenges are completed
  // - Streak milestones are reached (2, 4, 8, 12, 24 weeks)

  return <div>Challenges Dashboard</div>;
}
```

## Toast Types

| Type | Description | Icon |
|------|-------------|------|
| `achievement` | Achievement unlock notification | Custom emoji based on achievement rarity |
| `challenge` | Challenge completion notification | Trophy icon |
| `streak` | Streak milestone notification | Flame icon |
| `info` | General information notification | Star icon |

## Rarity Colors

Achievements have rarity-based colors:

- `common`: Gray
- `rare`: Blue
- `epic`: Purple
- `legendary`: Yellow

## Mobile Responsiveness

The toast container is fully responsive:

- **Mobile:** Top-right corner, max-width 288px
- **Desktop:** Top-right corner with more spacing, max-width 384px
- Animations slide in from the right with fade effect
- Toasts auto-dismiss after 5-6 seconds
- Dismiss button always available

## Examples

### Example 1: After Saving a Match

```tsx
import { useAchievementsWithToasts } from "@/hooks/useAchievementsWithToasts";

export default function MatchForm({ groupId, userId }) {
  const { checkAndNotify } = useAchievementsWithToasts();

  const handleSubmit = async (formData: MatchFormData) => {
    await saveMatch(formData);
    await checkAndNotify(groupId, userId);
    // Redirect or show success message
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example 2: Challenges Dashboard

```tsx
import { useChallengesWithToasts } from "@/hooks/useChallengesWithToasts";

export default function ChallengesDashboard({ group, userId }) {
  // This hook will automatically monitor progress and show toasts
  useChallengesWithToasts(group.id, userId);

  return (
    <div>
      <h1>Weekly Challenges</h1>
      {/* Challenge UI components */}
    </div>
  );
}
```

### Example 3: Manual Toast Trigger

```tsx
import { useToast } from "@/components/ui/toast";

export default function CustomNotificationButton() {
  const { showAchievement } = useToast();

  return (
    <button
      onClick={() => {
        showAchievement({
          name: "Special Achievement",
          description: "Unlocked by completing a special action",
          icon: "🌟",
          rarity: "legendary",
        });
      }}
    >
      Show Achievement Toast
    </button>
  );
}
```

## Technical Details

- **Framework:** React hooks with Context API
- **State Management:** useState with auto-dismiss timeout
- **Animation:** CSS transitions with Tailwind utility classes
- **Z-Index:** 100 (above most UI elements, below modals)
- **Position:** Fixed top-right corner

## Performance

- Each toast auto-dismisses after 5-6 seconds to prevent clutter
- Maximum of ~4 visible toasts before older ones are removed
- Challenge progress checks run every 30 seconds to avoid excessive DB queries
- Achievement checks are only triggered when explicitly called (e.g., after saving a match)

## Future Enhancements

Potential improvements for the toast system:

1. **Queue Management:** Priority-based toast queue (achievements > challenges > info)
2. **Sound Effects:** Optional sound notifications
3. **Actionable Toasts:** Toasts with clickable buttons (e.g., "View Achievement")
4. **Grouping:** Group multiple achievements into one toast
5. **Settings:** User preferences for toast duration and type
6. **Analytics:** Track toast interaction and engagement
