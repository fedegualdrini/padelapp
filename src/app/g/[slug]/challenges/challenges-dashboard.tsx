"use client";

import { useState, useMemo } from "react";
import { Flame, Trophy, Users, Target, Award, SkipForward } from "lucide-react";
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
    color: "from-blue-500 to-cyan-500",
  },
  performance: {
    icon: Trophy,
    label: "Victorias",
    description: "Ganados esta semana",
    color: "from-yellow-500 to-orange-500",
  },
  social: {
    icon: Users,
    label: "Socios",
    description: "Diferentes parejas",
    color: "from-purple-500 to-pink-500",
  },
} as const;

export default function ChallengesDashboard({
  group,
  challengesData,
  weeklyLeaderboard,
  playerBadges,
  userId,
}: ChallengesDashboardProps) {
  const [showPastWeeks, setShowPastWeeks] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"weekly" | "streaks">("weekly");

  // Calculate time remaining on mount
  const [mountedTime] = useState(() => Date.now());

  if (!challengesData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <Target className="w-20 h-20 mx-auto text-slate-600 mb-4" />
            <h1 className="text-3xl font-bold text-slate-400 mb-2">No hay desafíos activos</h1>
            <p className="text-slate-500">Los desafíos semanales se generan cada lunes</p>
          </div>
        </div>
      </div>
    );
  }

  const { challenges, progress, streak, time_remaining } = challengesData;
  const timeRemaining = formatDistanceToNow(
    new Date(mountedTime + time_remaining * 1000),
    { addSuffix: true, locale: es }
  );

  const getStreakColor = (streak: number) => {
    if (streak >= 24) return "text-purple-400";
    if (streak >= 12) return "text-pink-400";
    if (streak >= 8) return "text-orange-400";
    if (streak >= 4) return "text-yellow-400";
    if (streak >= 2) return "text-green-400";
    return "text-slate-400";
  };

  const getStreakLabel = (streak: number) => {
    if (streak >= 24) return "¡Legendario!";
    if (streak >= 12) return "¡Jugador veterano!";
    if (streak >= 8) return "¡Dedicado!";
    if (streak >= 4) return "¡Consistente!";
    if (streak >= 2) return "¡Bien empezado!";
    return "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section with Streak */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-purple-500/10" />
        <div className="max-w-6xl mx-auto px-6 py-8 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Desafíos Semanales
              </h1>
              <p className="text-slate-400">
                Grupo: <span className="text-white font-semibold">{group.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Racha actual</p>
                <p className={`text-3xl font-bold ${getStreakColor(streak.current)} flex items-center gap-2`}>
                  <Flame className="w-8 h-8" />
                  {streak.current}
                </p>
                {streak.current >= 2 && (
                  <p className={`text-xs font-semibold ${getStreakColor(streak.current)}`}>
                    {getStreakLabel(streak.current)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Time Remaining */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Target className="w-4 h-4" />
              <span className="text-sm">
                Termina en <span className="text-white font-medium">{timeRemaining}</span>
              </span>
            </div>
            {!progress.skipped && progress.total_completed < 3 && (
              <button
                onClick={async () => {
                  const response = await fetch(`/api/groups/${group.id}/skip-week`, {
                    method: 'POST',
                  });
                  if (response.ok) {
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Saltar semana
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {challenges.map((challenge) => {
            const config = CHALLENGE_CONFIG[challenge.type as keyof typeof CHALLENGE_CONFIG];
            const Icon = config.icon;
            const progressData = progress[challenge.type as 'volume' | 'performance' | 'social'];

            return (
              <div
                key={challenge.type}
                className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${config.color} shadow-2xl`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Icon className="w-24 h-24" />
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{config.label}</h3>
                      <p className="text-sm text-white/80">{config.description}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold">
                        {progressData.current} / {challenge.target}
                      </span>
                      {progressData.completed && (
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          Completado
                        </span>
                      )}
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <div
                        className={`h-full transition-all duration-500 ease-out rounded-full ${
                          progressData.completed
                            ? 'bg-white'
                            : `bg-gradient-to-r ${config.color}`
                        }`}
                        style={{
                          width: `${Math.min((progressData.current / challenge.target) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className={`rounded-2xl p-6 mb-8 ${
          progress.skipped
            ? 'bg-slate-800 border-2 border-slate-700'
            : progress.total_completed === 3
            ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500'
            : 'bg-slate-800 border-2 border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {progress.skipped ? (
                <div className="p-3 bg-slate-700 rounded-full">
                  <SkipForward className="w-6 h-6 text-slate-400" />
                </div>
              ) : progress.total_completed === 3 ? (
                <div className="p-3 bg-green-500 rounded-full animate-pulse">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="p-3 bg-slate-700 rounded-full">
                  <Target className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {progress.skipped
                    ? "Semana saltada"
                    : progress.total_completed === 3
                    ? "¡Todos los desafíos completados!"
                    : `${progress.total_completed}/3 desafíos completados`}
                </h3>
                <p className="text-slate-400">
                  {progress.skipped
                    ? "Tu racha está protegida"
                    : progress.total_completed === 3
                    ? "¡Racha incrementada! 🎉"
                    : "Sigue jugando para completarlos"}
                </p>
              </div>
            </div>

            {!progress.skipped && progress.total_completed > 0 && progress.total_completed < 3 && (
              <div className="text-right">
                <p className="text-sm text-slate-400">Progreso</p>
                <p className="text-3xl font-bold text-white">{progress.total_completed}</p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Rankings</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTab("weekly")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === "weekly"
                    ? "bg-white text-slate-900"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => setSelectedTab("streaks")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === "streaks"
                    ? "bg-white text-slate-900"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Rachas
              </button>
            </div>
          </div>

          {weeklyLeaderboard && weeklyLeaderboard.leaderboard.length > 0 && (
            <div className="bg-slate-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-700">
                {weeklyLeaderboard.leaderboard.map((entry) => (
                  <div
                    key={entry.player_id}
                    className={`flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors ${
                      entry.player_id === userId ? "bg-slate-700/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm">
                        {entry.position === 1 ? (
                          <span className="text-yellow-400">🥇</span>
                        ) : entry.position === 2 ? (
                          <span className="text-slate-400">🥈</span>
                        ) : entry.position === 3 ? (
                          <span className="text-amber-600">🥉</span>
                        ) : (
                          <span className="text-slate-400">#{entry.position}</span>
                        )}
                      </div>
                      <span className="font-medium">{entry.player_name}</span>
                      {entry.player_id === userId && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          Tú
                        </span>
                      )}
                    </div>

                    {selectedTab === "weekly" ? (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-xl">{entry.challenges_completed}/3</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Flame className={`w-4 h-4 ${getStreakColor(entry.current_streak)}`} />
                        <span className={`font-bold text-xl ${getStreakColor(entry.current_streak)}`}>
                          {entry.current_streak}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badges Section */}
        {playerBadges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Tus Logros</h2>
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {playerBadges.slice(0, 5).map((badge) => (
                  <div
                    key={badge.earned_at}
                    className="flex flex-col items-center text-center p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <div className="text-4xl mb-2">{badge.badges.icon}</div>
                    <p className="font-semibold text-sm">{badge.badges.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(badge.earned_at).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
