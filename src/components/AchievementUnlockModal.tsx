"use client";

import { useEffect, useState } from 'react';
import Confetti from './Confetti';
import AchievementBadge from './AchievementBadge';

type Achievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

type AchievementUnlockModalProps = {
  achievements: Achievement[];
  onClose?: () => void;
  autoCloseDelay?: number;
};

export default function AchievementUnlockModal({
  achievements,
  onClose,
  autoCloseDelay = 5000,
}: AchievementUnlockModalProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for exit animation
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  if (!isVisible && !onClose) return null;

  return (
    <>
      <Confetti active={isVisible} />
      <div
        className={`
          fixed inset-0 z-50 flex items-center justify-center
          transition-opacity duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          className={`
            relative z-10 w-full max-w-md mx-4
            rounded-2xl border border-[color:var(--card-border)]
            bg-[color:var(--card-solid)] p-6 shadow-2xl
            transition-all duration-300 transform
            ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label="Cerrar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <div className="mb-4">
              <h2 className="font-display text-2xl text-[var(--ink)]">
                ¡Nuevo Logro Desbloqueado!
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {achievements.length === 1
                  ? 'Has desbloqueado un nuevo logro'
                  : `Has desbloqueado ${achievements.length} nuevos logros`}
              </p>
            </div>

            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.key}
                  className="flex items-center gap-4 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-4"
                >
                  <AchievementBadge
                    name={achievement.name}
                    icon={achievement.icon}
                    rarity={achievement.rarity}
                    size="lg"
                  />
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-[var(--ink)]">
                      {achievement.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {achievement.description}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider font-semibold">
                      <span className={
                        achievement.rarity === 'common' ? 'text-gray-400' :
                        achievement.rarity === 'rare' ? 'text-blue-400' :
                        achievement.rarity === 'epic' ? 'text-purple-400' :
                        'text-yellow-400'
                      }>
                        {achievement.rarity}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-lg bg-[color:var(--accent)] px-4 py-2 font-semibold text-white transition hover:bg-[color:var(--accent)]/90"
            >
              ¡Genial!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
