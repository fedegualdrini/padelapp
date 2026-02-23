"use client";

interface EquipmentCardProps {
  equipment?: {
    racket?: string | null;
    shoes?: string | null;
  } | null;
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const hasEquipment = equipment?.racket || equipment?.shoes;

  if (!hasEquipment) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">
            sports_tennis
          </span>
          <p className="font-medium mb-1">Sin información de equipo</p>
          <p className="text-sm">
            Este jugador no ha añadido su equipo aún
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary text-3xl">
          sports_tennis
        </span>
        <h3 className="text-background-dark dark:text-white font-bold text-lg">
          Equipo
        </h3>
      </div>

      <div className="space-y-4">
        {/* Racket */}
        {equipment?.racket && (
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-green-50 dark:from-primary/10 dark:to-green-900/20 rounded-lg border border-primary/20">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                sports_tennis
              </span>
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-1">
                Pala
              </p>
              <p className="text-background-dark dark:text-white font-semibold">
                {equipment.racket}
              </p>
            </div>
          </div>
        )}

        {/* Shoes */}
        {equipment?.shoes && (
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">
                hiking
              </span>
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-1">
                Zapatillas
              </p>
              <p className="text-background-dark dark:text-white font-semibold">
                {equipment.shoes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
