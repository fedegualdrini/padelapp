"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { X, Trophy, Flame, Award, Star } from 'lucide-react';

export type ToastType = 'achievement' | 'challenge' | 'streak' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showAchievement: (achievement: {
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }) => void;
  showChallengeComplete: (type: 'volume' | 'performance' | 'social' | 'all') => void;
  showStreakMilestone: (weeks: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showAchievement = useCallback((achievement: {
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }) => {
    addToast({
      type: 'achievement',
      title: '¡Logro Desbloqueado!',
      message: achievement.name,
      icon: achievement.icon,
      rarity: achievement.rarity,
      duration: 6000,
    });
  }, [addToast]);

  const showChallengeComplete = useCallback((type: 'volume' | 'performance' | 'social' | 'all') => {
    const typeNames = {
      volume: 'Reto de Partidos',
      performance: 'Reto de Victorias',
      social: 'Reto Social',
      all: '¡Semana Completa!',
    };

    addToast({
      type: 'challenge',
      title: typeNames[type],
      message: type === 'all'
        ? 'Has completado los 3 retos semanales'
        : `Has completado el ${typeNames[type]}`,
      duration: 5000,
    });
  }, [addToast]);

  const showStreakMilestone = useCallback((weeks: number) => {
    addToast({
      type: 'streak',
      title: '¡Récord de Racha!',
      message: `${weeks} semanas consecutivas completando retos`,
      duration: 6000,
    });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        showAchievement,
        showChallengeComplete,
        showStreakMilestone,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none sm:top-6 sm:right-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const getIcon = () => {
    if (toast.type === 'achievement') {
      return toast.icon || '🏆';
    }
    if (toast.type === 'challenge') {
      return <Trophy className="w-5 h-5" />;
    }
    if (toast.type === 'streak') {
      return <Flame className="w-5 h-5 text-orange-500" />;
    }
    return <Star className="w-5 h-5" />;
  };

  const getRarityColor = () => {
    if (!toast.rarity) return 'text-gray-500';
    switch (toast.rarity) {
      case 'common':
        return 'text-gray-400';
      case 'rare':
        return 'text-blue-400';
      case 'epic':
        return 'text-purple-400';
      case 'legendary':
        return 'text-yellow-400';
    }
  };

  return (
    <div
      className={`
        pointer-events-auto w-full max-w-xs sm:max-w-sm
        rounded-xl border bg-[color:var(--card-solid)]
        shadow-lg backdrop-blur-sm
        transform transition-all duration-300
        animate-in slide-in-from-right-full fade-in
        border-[color:var(--card-border)]
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 text-2xl ${toast.type === 'achievement' ? getRarityColor() : ''}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {toast.title}
          </p>
          <p className="mt-0.5 text-sm text-[var(--muted)] line-clamp-2">
            {toast.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
