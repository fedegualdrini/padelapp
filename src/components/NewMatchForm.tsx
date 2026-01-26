"use client";

import { useMemo, useState, type FormEvent, useActionState } from "react";
import { createMatch } from "@/app/matches/new/actions";
import MatchPredictionBanner from "./MatchPredictionBanner";

type Player = {
  id: string;
  name: string;
  status: string;
};

type UsualPair = {
  playerAId: string;
  playerBId: string;
  label: string;
};

type NewMatchFormProps = {
  players: Player[];
  usualPairs: UsualPair[];
  defaultDate: string;
  groupId: string;
  groupSlug: string;
};

export default function NewMatchForm({
  players,
  usualPairs,
  defaultDate,
  groupId,
  groupSlug,
}: NewMatchFormProps) {
  const [state, formAction] = useActionState(createMatch, { error: null });
  const [team1Player1, setTeam1Player1] = useState("");
  const [team1Player2, setTeam1Player2] = useState("");
  const [team2Player1, setTeam2Player1] = useState("");
  const [team2Player2, setTeam2Player2] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const playerOptions = useMemo(
    () =>
      players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.name}
        </option>
      )),
    [players]
  );

  const handlePairClick = (pair: UsualPair) => {
    const team1HasAny = team1Player1 !== "" || team1Player2 !== "";
    if (!team1HasAny) {
      setTeam1Player1(pair.playerAId);
      setTeam1Player2(pair.playerBId);
      return;
    }
    setTeam2Player1(pair.playerAId);
    setTeam2Player2(pair.playerBId);
  };

  const isValidSetScore = (team1: number, team2: number) =>
    (team1 === 6 && team2 >= 0 && team2 <= 4) ||
    (team2 === 6 && team1 >= 0 && team1 <= 4) ||
    (team1 === 7 && (team2 === 5 || team2 === 6)) ||
    (team2 === 7 && (team1 === 5 || team1 === 6));

  const handleClientValidation = (event: FormEvent<HTMLFormElement>) => {
    setClientError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const bestOf = Number(formData.get("best_of") ?? 3);
    const requiredSets = Math.floor(bestOf / 2) + 1;
    const setScores: { setNumber: number; team1: number; team2: number }[] = [];

    for (let i = 1; i <= 5; i += 1) {
      const team1Raw = String(formData.get(`set${i}_team1`) ?? "").trim();
      const team2Raw = String(formData.get(`set${i}_team2`) ?? "").trim();
      if (team1Raw === "" && team2Raw === "") continue;
      if (team1Raw === "" || team2Raw === "") {
        event.preventDefault();
        setClientError(`Set ${i} debe tener ambos puntajes.`);
        return;
      }
      const team1 = Number(team1Raw);
      const team2 = Number(team2Raw);
      if (Number.isNaN(team1) || Number.isNaN(team2)) {
        event.preventDefault();
        setClientError(`Set ${i} debe tener puntajes válidos.`);
        return;
      }
      if (!isValidSetScore(team1, team2)) {
        event.preventDefault();
        setClientError(`Set ${i} tiene un marcador inválido.`);
        return;
      }
      setScores.push({ setNumber: i, team1, team2 });
    }

    if (setScores.length < requiredSets) {
      event.preventDefault();
      setClientError("El partido está incompleto. Cargá todos los sets jugados.");
      return;
    }
  };

  return (
    <form
      className="grid gap-6"
      action={formAction}
      onSubmit={handleClientValidation}
    >
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="group_slug" value={groupSlug} />
      {(clientError || state?.error) && (
        <div
          className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-solid)] p-4 text-sm text-[var(--ink)]"
          role="status"
          aria-live="polite"
        >
          {clientError ?? state?.error}
        </div>
      )}
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
              defaultValue={defaultDate}
              autoComplete="off"
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Hora
            <input
              type="time"
              name="played_time"
              autoComplete="off"
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Mejor de
            <select
              name="best_of"
              aria-label="Mejor de sets"
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="3">3 sets</option>
              <option value="5">5 sets</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            Cargado por
            <input
              type="text"
              name="created_by"
              placeholder="Tu nombre (ej: Fede?)"
              autoComplete="off"
              className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-glass)] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--ink)]">
            Parejas habituales
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Tocá para autocompletar
          </p>
        </div>
        {usualPairs.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Aún no hay parejas habituales.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {usualPairs.map((pair) => (
              <button
                key={`${pair.playerAId}-${pair.playerBId}`}
                type="button"
                onClick={() => handlePairClick(pair)}
                className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-solid)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:-translate-y-0.5"
              >
                {pair.label}
              </button>
            ))}
          </div>
        )}
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
                value={team1Player1}
                onChange={(event) => setTeam1Player1(event.target.value)}
                aria-label="Equipo 1 jugador 1"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              >
                <option value="">Elegir jugador</option>
                {playerOptions}
              </select>
              <select
                name="team1_player2"
                value={team1Player2}
                onChange={(event) => setTeam1Player2(event.target.value)}
                aria-label="Equipo 1 jugador 2"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
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
                value={team2Player1}
                onChange={(event) => setTeam2Player1(event.target.value)}
                aria-label="Equipo 2 jugador 1"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              >
                <option value="">Elegir jugador</option>
                {playerOptions}
              </select>
              <select
                name="team2_player2"
                value={team2Player2}
                onChange={(event) => setTeam2Player2(event.target.value)}
                aria-label="Equipo 2 jugador 2"
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              >
                <option value="">Elegir jugador</option>
                {playerOptions}
              </select>
            </div>
          </div>
        </div>
      </section>

      <MatchPredictionBanner
        groupId={groupId}
        team1PlayerIds={[team1Player1 || null, team1Player2 || null]}
        team2PlayerIds={[team2Player1 || null, team2Player2 || null]}
        team1Names={[
          players.find((p) => p.id === team1Player1)?.name || "?",
          players.find((p) => p.id === team1Player2)?.name || "?",
        ]}
        team2Names={[
          players.find((p) => p.id === team2Player1)?.name || "?",
          players.find((p) => p.id === team2Player2)?.name || "?",
        ]}
      />

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
          {[1, 2, 3, 4, 5].map((setNumber) => (
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
                placeholder="Equipo 1 (ej: 6?)"
                name={`set${setNumber}_team1`}
                aria-label={`Set ${setNumber} - Equipo 1`}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                max={7}
                placeholder="Equipo 2 (ej: 4?)"
                name={`set${setNumber}_team2`}
                aria-label={`Set ${setNumber} - Equipo 2`}
                className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        >
          Guardar partido
        </button>
        <button
          type="button"
          className="rounded-full border border-[color:var(--card-border-strong)] bg-[color:var(--card-glass)] px-6 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[color:var(--card-solid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
