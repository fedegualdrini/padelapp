"use client";

import { useMemo, useState } from "react";
import { Flame, Trophy, Users, Target, Award, SkipForward, Info, Sparkles, Calendar, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Challenge {
  type: string;
  target: number;
}

interface ProgressItem {
  current: number;
  completed: boolean;
}

interface ChallengeProgress {
  volume: ProgressItem;
  performance: ProgressItem;
  social: ProgressItem;
  total_completed: number;
  skipped: boolean;
}

interface Streak {
  current: number;
  longest: number;
  last_completed: string | null;
}

interface ChallengesData {
  current_week: string;
  challenges: Challenge[];
  progress: ChallengeProgress;
  streak: Streak;
  time_remaining: number;
}

interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  position: number;
  challenges_completed: number;
  current_streak: number;
}

interface PlayerBadge {
  earned_at: string;
  badges: {
    name: string;
    description: string;
    badge_type: string;
    milestone_value: number | null;
    icon: string;
  };
}

interface ChallengesDashboardProps {
  group: { id: string; name: string; slug: string };
  challengesData: ChallengesData | null;
  weeklyLeaderboard: { leaderboard: LeaderboardEntry[]; week: string } | null;
  playerBadges: PlayerBadge[];
  userId: string;
}

const CHALLENGE_CONFIG = {
  volume: {
    icon: Target,
    label: "Partidos",
    description: "Jugados esta semana",
  },
  performance: {
    icon: Trophy,
    label: "Victorias",
    description: "Ganadas esta semana",
  },
  social: {
    icon: Users,
    label: "Socios",
    description: "Parejas distintas",
  },
} as const;

function PillButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] h-10 min-h-[40px] " +
        (active
          ? "bg-[var(--accent)] text-white"
          : "border border-[color:var(--card-border)] bg-[color:var(--card-glass)] text-[var(--ink)] hover:-translate-y-0.5")
      }
    >
      {children}
    </button>
  );
}

export default function ChallengesDashboard({
  group,
  challengesData,
  weeklyLeaderboard,
  playerBadges,
  userId,
}: ChallengesDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"weekly" | "streaks">("weekly");
  const [mountedTime] = useState(() => Date.now());

  const timeRemaining = useMemo(() => {
    if (!challengesData) return null;
    return formatDistanceToNow(new Date(mountedTime + challengesData.time_remaining * 1000), {
      addSuffix: true,
      locale: es,
    });
  }, [challengesData, mountedTime]);

  const getStreakTone = (streak: number) => {
    if (streak >= 24) return "text-[color:var(--accent)]";
    if (streak >= 12) return "text-[color:var(--accent)]";
    if (streak >= 4) return "text-amber-500";
    if (streak >= 2) return "text-emerald-500";
    return "text-[var(--muted)]";
  };

  if (!challengesData) {
    return (
      <div className="flex flex-col gap-6">
        {/* Explanation section - always visible */}
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-gradient-to-br from-[var(--accent)]/5 to-transparent p-6 shadow-[0_18px_40px_rgba(0,0,0,0.05)] backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[var(--accent)]/10 p-2">
              <Info className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[var(--ink)]">¿Qué son los desafíos semanales?</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Cada <strong className="text-[var(--ink)]">lunes</strong> se generan automáticamente 3 objetivos personalizados 
                para mantener la motivación y la diversión. Completa los tres para mantener tu racha y ganar badges exclusivos.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-[var(--muted)]"><strong className="text-[var(--ink)]">Partidos:</strong> Jugá más</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-[var(--muted)]"><strong className="text-[var(--ink)]">Victorias:</strong> Ganá partidos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-[var(--muted)]"><strong className="text-[var(--ink)]">Socios:</strong> Jugá con distintos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[var(--muted)]" />
            <div>
              <h2 className="font-display text-2xl text-[var(--ink)]">Desafíos semanales</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Los desafíos se generan automáticamente cada lunes. ¡Jugá tu primer partido para empezar!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { challenges, progress, streak } = challengesData;

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-[var(--ink)]">Desafíos semanales</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Grupo: {group.name}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Racha actual</p>
              <p className={`mt-2 flex items-center gap-2 text-2xl font-semibold ${getStreakTone(streak.current)}`}>
                <Flame className="h-5 w-5" />
                {streak.current}
              </p>
            </div>

            {!progress.skipped && progress.total_completed < 3 && (
              <button
                type="button"
                onClick={async () => {
                  const response = await fetch(`/api/groups/${group.id}/skip-week`, { method: "POST" });
                  if (response.ok) window.location.reload();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-glass)] px-3 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5 h-10 min-h-[40px]"
              >
                <SkipForward className="h-4 w-4" />
                <span className="hidden sm:inline">Saltar semana</span>
                <span className="sm:hidden">Saltar</span>
              </button>
            )}
          </div>
        </div>

        {timeRemaining && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
            <Target className="h-4 w-4" />
            Termina {timeRemaining}
          </div>
        )}
      </header>

      {/* What are challenges? - Explanation section */}
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-gradient-to-br from-[var(--accent)]/5 to-transparent p-6 shadow-[0_18px_40px_rgba(0,0,0,0.05)] backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[var(--accent)]/10 p-2">
            <Info className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="font-display text-lg text-[var(--ink)]">¿Qué son los desafíos semanales?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Cada <strong className="text-[var(--ink)]">lunes</strong> se generan automáticamente 3 objetivos personalizados 
              para mantener la motivación y la diversión. Completa los tres para mantener tu racha y ganar badges exclusivos.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-[var(--muted)]"><strong className="text-[var(--ink)]">Partidos:</strong> Jugá más</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-[var(--muted)]"><strong className="text-[var(--ink)]">Victorias:</strong> Ganá partidos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-[var(--muted)]"><strong className="text-[var(--ink)]">Socios:</strong> Jugá con distintos</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Se renuevan cada lunes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" />
                <span>Completalos para sumar racha</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Podés saltar 1 semana por mes sin perder racha</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ganá badges por rachas largas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {challenges.map((challenge) => {
          const config = CHALLENGE_CONFIG[challenge.type as keyof typeof CHALLENGE_CONFIG];
          const Icon = config.icon;
          const progressData = progress[challenge.type as "volume" | "performance" | "social"];
          const percent = Math.min((progressData.current / challenge.target) * 100, 100);

          return (
            <div
              key={challenge.type}
              className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-2">
                    <Icon className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-[var(--ink)]">{config.label}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{config.description}</p>
                  </div>
                </div>
                {progressData.completed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Award className="h-3.5 w-3.5" />
                    Listo
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--ink)]">
                    {progressData.current} / {challenge.target}
                  </span>
                  <span className="text-[var(--muted)]">{Math.round(percent)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[color:var(--card-border)]/40">
                  <div
                    className="h-2 rounded-full bg-[var(--accent)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-[var(--ink)]">Resumen</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {progress.skipped
                ? "Semana saltada (tu racha queda protegida)."
                : progress.total_completed === 3
                ? "¡Completaste todos los desafíos de la semana!"
                : `Llevás ${progress.total_completed}/3 desafíos.`}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] px-4 py-3 text-sm font-semibold text-[var(--ink)]">
            {progress.total_completed}/3
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl text-[var(--ink)]">Ranking</h3>
          <div className="flex gap-2">
            <PillButton active={selectedTab === "weekly"} onClick={() => setSelectedTab("weekly")}>
              Semana
            </PillButton>
            <PillButton active={selectedTab === "streaks"} onClick={() => setSelectedTab("streaks")}>
              Rachas
            </PillButton>
          </div>
        </div>

        {weeklyLeaderboard && weeklyLeaderboard.leaderboard.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)]">
            <div className="divide-y divide-[color:var(--card-border)]">
              {weeklyLeaderboard.leaderboard.map((entry) => (
                <div
                  key={entry.player_id}
                  className={
                    "flex items-center justify-between gap-3 px-4 py-3 " +
                    (entry.player_id === userId ? "bg-[color:var(--card-glass)]" : "")
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 text-sm font-semibold text-[var(--muted)]">#{entry.position}</span>
                    <span className="text-sm font-semibold text-[var(--ink)]">{entry.player_name}</span>
                    {entry.player_id === userId && (
                      <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                        Vos
                      </span>
                    )}
                  </div>
                  {selectedTab === "weekly" ? (
                    <span className="text-sm font-semibold text-[var(--ink)]">{entry.challenges_completed}/3</span>
                  ) : (
                    <span className={`text-sm font-semibold ${getStreakTone(entry.current_streak)}`}>{entry.current_streak}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">Todavía no hay posiciones para esta semana.</p>
        )}
      </section>

      {playerBadges.length > 0 && (
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
          <h3 className="font-display text-xl text-[var(--ink)]">Tus badges</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Los últimos que ganaste.</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {playerBadges.slice(0, 5).map((badge) => (
              <div
                key={badge.earned_at}
                className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 text-center"
              >
                <div className="text-3xl">{badge.badges.icon}</div>
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{badge.badges.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(badge.earned_at).toLocaleDateString("es-AR", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
