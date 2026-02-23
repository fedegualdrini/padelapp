"use client";

interface SkillBreakdownProps {
  forehand?: number | null;
  backhand?: number | null;
  serve?: number | null;
  volley?: number | null;
}

interface SkillBarProps {
  label: string;
  value: number | null;
  color: string;
}

function SkillBar({ label, value, color }: SkillBarProps) {
  const displayValue = value ?? 0;
  const percentage = (displayValue / 100) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-background-dark dark:text-white font-semibold text-sm">
          {label}
        </span>
        <span
          className={`font-bold text-sm ${
            displayValue >= 80
              ? "text-green-500"
              : displayValue >= 60
              ? "text-primary"
              : displayValue >= 40
              ? "text-yellow-500"
              : "text-orange-500"
          }`}
        >
          {displayValue > 0 ? `${displayValue}/100` : "-"}
        </span>
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function SkillBreakdown({
  forehand,
  backhand,
  serve,
  volley,
}: SkillBreakdownProps) {
  const hasAnySkills = forehand || backhand || serve || volley;

  if (!hasAnySkills) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">
            analytics
          </span>
          <p className="font-medium mb-1">Sin datos de habilidades</p>
          <p className="text-sm">
            Este jugador no ha completado su perfil de habilidades aún
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary text-3xl">
          analytics
        </span>
        <h3 className="text-background-dark dark:text-white font-bold text-lg">
          Análisis de Habilidades
        </h3>
      </div>

      <div className="space-y-6">
        <SkillBar label="Derecha" value={forehand ?? null} color="bg-gradient-to-r from-green-400 to-green-600" />
        <SkillBar label="Revés" value={backhand ?? null} color="bg-gradient-to-r from-blue-400 to-blue-600" />
        <SkillBar label="Servicio" value={serve ?? null} color="bg-gradient-to-r from-purple-400 to-purple-600" />
        <SkillBar label="Volea" value={volley ?? null} color="bg-gradient-to-r from-orange-400 to-orange-600" />
      </div>

      {/* Overall Score */}
      {(forehand || backhand || serve || volley) && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-background-dark dark:text-white font-semibold">
              Puntuación General
            </span>
            <div className="flex items-center gap-2">
              <span className="text-background-dark dark:text-white font-black text-2xl">
                {Math.round(
                  ((forehand || 0) + (backhand || 0) + (serve || 0) + (volley || 0)) /
                    ((forehand ? 1 : 0) +
                      (backhand ? 1 : 0) +
                      (serve ? 1 : 0) +
                      (volley ? 1 : 0) || 1)
                )}
              </span>
              <span className="text-slate-500 text-sm">/100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
