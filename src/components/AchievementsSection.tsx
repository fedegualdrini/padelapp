"use client";

import { useState } from 'react';
import AchievementBadge from './AchievementBadge';

export type Achievement = {
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

const categoryIcons: Record<CategoryFilter, string> = {
  all: '🎯',
  matches: '🏓',
  streaks: '🔥',
  elo: '📊',
  rankings: '🏆',
  special: '✨',
};

const rarityColors = {
  common: 'text-gray-500',
  rare: 'text-blue-500',
  epic: 'text-purple-500',
  legendary: 'text-yellow-500',
};

type AchievementsSectionProps = {
  unlocked: Achievement[];
  locked: Achievement[];
};

export default function AchievementsSection({
  unlocked = [],
  locked = [],
}: AchievementsSectionProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [showLocked, setShowLocked] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Ensure arrays are valid
  const safeUnlocked = Array.isArray(unlocked) ? unlocked : [];
  const safeLocked = Array.isArray(locked) ? locked : [];

  const filteredUnlocked = safeUnlocked.filter(a =>
    filter === 'all' || a.category === filter
  );
  const filteredLocked = safeLocked.filter(a =>
    filter === 'all' || a.category === filter
  );

  const unlockedCount = safeUnlocked.length;
  const totalCount = unlockedCount + safeLocked.length;
  const completionPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Group locked achievements by progress tier
  const lockedInProgress = filteredLocked.filter(a => (a.progress_percent ?? 0) >= 25);
  const lockedNotStarted = filteredLocked.filter(a => (a.progress_percent ?? 0) < 25);

  // If no achievements available at all
  if (totalCount === 0) {
    return (
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mb-4">
          <h2 className="font-display text-2xl text-[var(--ink)]">Logros</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sistema de gamificación y badges
          </p>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-[var(--ink)] font-medium">¡Los logros están configurándose!</p>
          <p className="text-sm text-[var(--muted)] mt-2">
            Pronto podrás desbloquear logros jugando partidos.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      {/* Header with stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-[var(--ink)]">Logros</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {unlockedCount} de {totalCount} desbloqueados ({completionPercent}%)
            </p>
          </div>
          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md px-2 py-1 text-sm transition-all ${
                viewMode === 'grid'
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              ▦
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md px-2 py-1 text-sm transition-all ${
                viewMode === 'list'
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              ☰
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-[color:var(--card-border)]">
            <div
              className="h-full bg-gradient-to-r from-[color:var(--accent)] to-emerald-500 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
            <span>{unlockedCount} desbloqueados</span>
            <span>{safeLocked.length} por desbloquear</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => {
          const count = cat === 'all'
            ? totalCount
            : safeUnlocked.filter(a => a.category === cat).length + safeLocked.filter(a => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`
                flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
                ${
                  filter === cat
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'bg-[color:var(--card-solid)] text-[var(--muted)] hover:text-[var(--ink)]'
                }
              `}
            >
              <span>{categoryIcons[cat]}</span>
              <span>{categoryLabels[cat]}</span>
              <span className={`text-xs ${filter === cat ? 'text-white/70' : 'text-[var(--muted)]'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Unlocked achievements */}
      {filteredUnlocked.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display text-lg text-[var(--ink)] mb-3 flex items-center gap-2">
            <span>✅</span>
            Desbloqueados ({filteredUnlocked.length})
          </h3>
          <div className={viewMode === 'grid' 
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-2"
          }>
            {filteredUnlocked.map((achievement) => (
              <div
                key={achievement.key}
                className={`rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] transition-all hover:scale-[1.02] hover:shadow-md ${
                  viewMode === 'grid' ? 'p-4' : 'p-3'
                }`}
              >
                <div className={viewMode === 'grid' ? "flex items-start justify-between gap-3" : "flex items-center gap-3"}>
                  <AchievementBadge
                    name={achievement.name}
                    icon={achievement.icon}
                    rarity={achievement.rarity}
                    size={viewMode === 'grid' ? 'md' : 'sm'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[var(--ink)] truncate">
                        {achievement.name}
                      </h4>
                      <span className={`text-xs uppercase font-medium ${rarityColors[achievement.rarity]}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    {viewMode === 'grid' && (
                      <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                        {achievement.description}
                      </p>
                    )}
                    {achievement.unlocked_at && (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {viewMode === 'grid' ? 'Desbloqueado el ' : ''}{new Date(achievement.unlocked_at).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle locked achievements */}
      <div className="mb-4">
        <button
          onClick={() => setShowLocked(!showLocked)}
          className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
        >
          <span className={`text-lg transition-all ${showLocked ? 'text-[color:var(--accent)]' : 'opacity-50'}`}>
            {showLocked ? '▼' : '▶'}
          </span>
          {showLocked ? 'Ocultar' : 'Mostrar'} logros pendientes ({filteredLocked.length})
        </button>
      </div>

      {/* Locked achievements */}
      {showLocked && filteredLocked.length > 0 && (
        <div className="space-y-6">
          {/* In Progress */}
          {lockedInProgress.length > 0 && (
            <div>
              <h4 className="font-display text-base text-[var(--ink)] mb-3 flex items-center gap-2">
                <span>🔥</span>
                En progreso ({lockedInProgress.length})
              </h4>
              <div className={viewMode === 'grid' 
                ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-2"
              }>
                {lockedInProgress.map((achievement) => (
                  <div
                    key={achievement.key}
                    className={`rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] transition-all hover:scale-[1.02] hover:shadow-md ${
                      viewMode === 'grid' ? 'p-4' : 'p-3'
                    }`}
                  >
                    <div className={viewMode === 'grid' ? "flex items-start justify-between gap-3" : "flex items-center gap-3"}>
                      <AchievementBadge
                        name={achievement.name}
                        icon={achievement.icon}
                        rarity={achievement.rarity}
                        size={viewMode === 'grid' ? 'md' : 'sm'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[var(--ink)] truncate">
                            {achievement.name}
                          </h4>
                          <span className={`text-xs uppercase font-medium ${rarityColors[achievement.rarity]}`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        {viewMode === 'grid' && (
                          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-1">
                            {achievement.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {achievement.progress && (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-[var(--muted)]">Progreso</span>
                          <span className="font-medium text-[var(--ink)]">
                            {achievement.progress.current ?? 0} / {achievement.progress.target ?? 0}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--card-border)]">
                          <div
                            className="h-full bg-[color:var(--accent)] transition-all duration-300"
                            style={{ width: `${Math.min(achievement.progress_percent ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Not Started */}
          {lockedNotStarted.length > 0 && (
            <div>
              <h4 className="font-display text-base text-[var(--ink)] mb-3 flex items-center gap-2">
                <span>🎯</span>
                Por conseguir ({lockedNotStarted.length})
              </h4>
              <div className={viewMode === 'grid' 
                ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-2"
              }>
                {lockedNotStarted.map((achievement) => (
                  <div
                    key={achievement.key}
                    className={`rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] opacity-60 ${
                      viewMode === 'grid' ? 'p-4' : 'p-3'
                    }`}
                  >
                    <div className={viewMode === 'grid' ? "flex items-start justify-between gap-3" : "flex items-center gap-3"}>
                      <AchievementBadge
                        name={achievement.name}
                        icon={achievement.icon}
                        rarity={achievement.rarity}
                        size={viewMode === 'grid' ? 'md' : 'sm'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[var(--ink)] truncate">
                            {achievement.name}
                          </h4>
                          <span className={`text-xs uppercase font-medium ${rarityColors[achievement.rarity]}`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        {viewMode === 'grid' && (
                          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
                            {achievement.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {achievement.progress && achievement.progress.target && (
                      <div className="mt-2 text-xs text-[var(--muted)]">
                        Requisito: {achievement.progress.target} {achievement.category === 'matches' ? 'partidos' : 
                          achievement.category === 'streaks' ? 'victorias consecutivas' :
                          achievement.category === 'elo' ? 'ELO' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state for current filter */}
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
