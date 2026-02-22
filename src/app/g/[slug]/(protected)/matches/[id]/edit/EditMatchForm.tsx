"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMatch } from "@/app/matches/[id]/edit/actions";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";

type Player = {
  id: string;
  name: string;
};

type MatchEditData = {
  id: string;
  date: string;
  time: string;
  bestOf: number;
  createdBy: string;
  teamPlayers: string[][];
  setScores: { setNumber: number; team1: number; team2: number }[];
};

type EditMatchFormProps = {
  match: MatchEditData;
  players: Player[];
  groupId: string;
  groupSlug: string;
};

export default function EditMatchForm({
  match,
  players,
  groupId,
  groupSlug,
}: EditMatchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const playerOptions = players.map((player) => (
    <option key={player.id} value={player.id}>
      {player.name}
    </option>
  ));

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateMatch(formData);
        toast.success("Partido actualizado correctamente");
        router.push(`/g/${groupSlug}/matches/${match.id}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al actualizar el partido";
        toast.error(errorMessage);
      }
    });
  };

  return (
    <form className="grid gap-6" action={handleSubmit}>
      <input type="hidden" name="match_id" value={match.id} />
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="group_slug" value={groupSlug} />
      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">
          Info del partido
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Fecha
            <input
              type="date"
              name="played_date"
              defaultValue={match.date}
              disabled={isPending}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Hora
            <input
              type="time"
              name="played_time"
              defaultValue={match.time}
              disabled={isPending}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Mejor de
            <select
              name="best_of"
              defaultValue={String(match.bestOf)}
              disabled={isPending}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="3">3 sets</option>
              <option value="5">5 sets</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Editado por
            <input
              type="text"
              name="updated_by"
              placeholder="Tu nombre"
              defaultValue={match.createdBy}
              disabled={isPending}
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <h3 className="font-display text-lg text-[var(--ink)]">Equipos</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Equipo 1
            </p>
            <div className="mt-3 grid gap-3">
              <select
                name="team1_player1"
                defaultValue={match.teamPlayers[0]?.[0] ?? ""}
                disabled={isPending}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Elegir jugador</option>
                {playerOptions}
              </select>
              <select
                name="team1_player2"
                defaultValue={match.teamPlayers[0]?.[1] ?? ""}
                disabled={isPending}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Elegir jugador</option>
                {playerOptions}
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Equipo 2
            </p>
            <div className="mt-3 grid gap-3">
              <select
                name="team2_player1"
                defaultValue={match.teamPlayers[1]?.[0] ?? ""}
                disabled={isPending}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Elegir jugador</option>
                {playerOptions}
              </select>
              <select
                name="team2_player2"
                defaultValue={match.teamPlayers[1]?.[1] ?? ""}
                disabled={isPending}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Elegir jugador</option>
                {playerOptions}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--ink)]">
            Marcador por set
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Cargá todos los sets jugados (máx. 5)
          </p>
        </div>
        <div className="mt-4 grid gap-3">
          {[1, 2, 3, 4, 5].map((setNumber) => {
            const set = match.setScores.find(
              (item) => item.setNumber === setNumber
            );
            return (
              <div
                key={setNumber}
                className="grid grid-cols-[80px_repeat(2,1fr)] items-center gap-3"
              >
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Set {setNumber}
                </span>
                <input
                  type="number"
                  min={0}
                  max={7}
                  placeholder="Equipo 1"
                  name={`set${setNumber}_team1`}
                  defaultValue={set?.team1 ?? ""}
                  disabled={isPending}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
                />
                <input
                  type="number"
                  min={0}
                  max={7}
                  placeholder="Equipo 2"
                  name={`set${setNumber}_team2`}
                  defaultValue={set?.team2 ?? ""}
                  disabled={isPending}
                  className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm disabled:opacity-50"
                />
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending && <Spinner size="sm" />}
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-6 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)] disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
