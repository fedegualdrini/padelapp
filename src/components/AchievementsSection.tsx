"use client";

import { useState } from 'react';
import AchievementBadge from './AchievementBadge';

type Achievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  unlocked_at?: string;
  progress?: {
    current: number | null;
    target: number | null;
  };
  progress_percent?: number;
};

type CategoryFilter = 'all' | 'matches' | 'streaks' | 'elo' | 'rankings' | 'special';

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'Todos',
  matches: 'Partidos',
  streaks: 'Rachas',
  elo: 'ELO',
  rankings: 'Rankings',
  special: 'Especiales',
};

type AchievementsSectionProps = {
  unlocked: Achievement[];
  locked: Achievement[];
};

export default function AchievementsSection({
  unlocked,
  locked,
}: AchievementsSectionProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showLocked, setShowLocked] = useState(true);

  const filteredUnlocked = unlocked.filter(a =>
    filter === 'all' || a.category === filter
  );
  const filteredLocked = locked.filter(a =>
    filter === 'all' || a.category === filter
  );

  const unlockedCount = unlocked.length;
  const totalCount = unlockedCount + locked.length;
  const completionPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-[var(--ink)]">Logros</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {unlockedCount} de {totalCount} desbloqueados ({completionPercent}%)
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[color:var(--card-border)]">
          <div
            className="h-full bg-[color:var(--accent)] transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`
              rounded-lg px-3 py-1.5 text-sm font-medium transition-all
              ${
                filter === cat
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'bg-[color:var(--card-solid)] text-[var(--muted)] hover:text-[var(--ink)]'
              }
            `}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Toggle locked achievements */}
      <div className="mb-4">
        <button
          onClick={() => setShowLocked(!showLocked)}
          className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <span className={showLocked ? 'text-[color:var(--accent)]' : 'opacity-50'}>
            {showLocked ? '●' : '○'}
          </span>
          Mostrar logros pendientes
        </button>
      </div>

      {/* Unlocked achievements */}
      {filteredUnlocked.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display text-lg text-[var(--ink)] mb-3">
            Desbloqueados ({filteredUnlocked.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUnlocked.map((achievement) => (
              <div
                key={achievement.key}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 transition-all hover:scale-[1.02] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AchievementBadge
                        name={achievement.name}
                        icon={achievement.icon}
                        rarity={achievement.rarity}
                        size="md"
                      />
                      <h4 className="font-semibold text-[var(--ink)]">
                        {achievement.name}
                      </h4>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {achievement.unlocked_at && (
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Desbloqueado el {new Date(achievement.unlocked_at).toLocaleDateString('es-AR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked achievements */}
      {showLocked && filteredLocked.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-[var(--ink)] mb-3">
            Pendientes ({filteredLocked.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLocked.map((achievement) => (
              <div
                key={achievement.key}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 opacity-75"
              >
                <div className="flex items-center gap-3">
                  <AchievementBadge
                    name={achievement.name}
                    icon={achievement.icon}
                    rarity={achievement.rarity}
                    size="md"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-[var(--ink)]">
                      {achievement.name}
                    </h4>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {achievement.progress && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[var(--muted)]">
                        Progreso
                      </span>
                      <span className="font-medium text-[var(--ink)]">
                        {achievement.progress.current ?? 0} / {achievement.progress.target ?? 0}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--card-border)]">
                      <div
                        className="h-full bg-[color:var(--accent)] transition-all duration-300"
                        style={{ width: `${achievement.progress_percent ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredUnlocked.length === 0 && filteredLocked.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[var(--muted)]">
            {filter === 'all'
              ? 'No hay logros disponibles.'
              : `No hay logros en la categoría "${categoryLabels[filter]}".`}
          </p>
        </div>
      )}
    </section>
  );
}
